import { GraphQLClient } from 'graphql-request';
import axios from 'axios';
import Tar from 'tarts';
import untar from 'js-untar';
import * as gz from 'jsziptools/gz';
import shortid from 'shortid';
import { NotLoggedInError, ProjectNotFoundError, TemplateNotFoundError } from './error';

const {
  REACT_APP_CELLO_HOST_URL,
} = process.env;

const API_SESSION = REACT_APP_CELLO_HOST_URL + '/auth/session';
const API_GRAPHQL = REACT_APP_CELLO_HOST_URL + '/graphql';
const API_PROJECT_DOWNLOAD = REACT_APP_CELLO_HOST_URL + '/api/1/project/download';
const API_PROJECT_UPLOAD = REACT_APP_CELLO_HOST_URL + '/api/1/project/upload';
const API_PROJECT_COMMIT = REACT_APP_CELLO_HOST_URL + '/api/1/project/commit';
const DIRECTORY_PROJECTS = '/viola/project';
const DIRECTORY_DEMO_PROJECT = '/viola/demo';
const DIRECTORY_BATA_PROJECT = '/viola/beta';
const DOWNLOAD_PROJECT_TIMEOUT = 20 * 1000;
const UPLOAD_PROJECT_TIMEOUT = 15 * 1000;

const FilerEvents = {
  Create: 'create',
  Move: 'move',
  Delete: 'delete',
};

const Bramble = window.Bramble;

class FilerImpl {
  open = async (filename, option = 'utf8') => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.readFile(filename, option, (err, data) => {
        if (err) rej(err);
        else res(data);
      });
    });
  }

  save = async (filename, data, override = false, writeOptions = null) => {
    const { path } = this;

    if (!override) {
      const fileExists = await this.exists(filename);
      if (fileExists) {
        throw Error(`file '${filename}' already exists`);
      }
    }
    await this.mkdirp(path.dirname(filename));
    await this.writeFile(filename, data, writeOptions);
  };

  stat = (path) => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.stat(path, (err, stats) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res(null);  // not found
          } else {
            rej(err);
          }
        }
        else res(stats);
      });
    });
  };

  exists = (path) => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.exists(path, res);
    });
  };

  rename = (oldPath, newPath) => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.rename(oldPath, newPath, err => {
        if (err) rej(err);
        else res();
      });
    });
  };

  mkdirp = (dirname) => {
    const { sh } = this;
    return new Promise((res, rej) => {
      sh.mkdirp(dirname, err => {
        if (err) rej(err);
        else res(dirname);
      });
    });
  };

  writeFile = async (filename, data, options) => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.writeFile(filename, data, options, err => {
        if (err) rej(err);
        else res(data);
      });
    });
  };

  removeFile = async (filename, recursive = false) => {
    const { sh } = this;
    return new Promise((res, rej) => {
      sh.rm(filename, { recursive }, (err) => {
        if (err) rej(err);
        else res();
      });
    });
  };

  readdir = async (path) => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.readdir(path, (err, files) => {
        if (err) rej(err);
        else res(files);
      });
    });
  };
}

export class SyncManager extends FilerImpl {
  constructor(args) {
    super(args);
    const { path, fs, sh, FilerBuffer, session, projectId } = args;
    this.path = path;
    this.fs = fs;
    this.sh = sh;
    this.FilerBuffer = FilerBuffer;
    this.session = session;
    this.projectId = projectId;

    this.syncingSemaphore = 1;
    this.queuedFilerEvents = [];
    this.requestFilerEvents = [];
    this.stalledFilerEvents = [];
    this.unsyncedFiles = {};
  }

  // Reduce event duplications by the time series
  static retroactFilerEvents(events) {
    function find(path, node) {
      if (node === true) {
        return true;
      } else if (typeof node !== 'object' || !(path[0] in node)) {
        return undefined;
      } else {
        if (path.length <= 1) {
          return node[path[0]];
        } else {
          return find(path.slice(1), node[path[0]]);
        }
      }
    }
    function set(path, value, node) {
      if (path.length <= 1) {
        node[path[0]] = value;
      } else {
        if (!(path[0] in node) || typeof node[path[0]] !== 'object') {
          node[path[0]] = {};
        }
        set(path.slice(1), value, node[path[0]]);
      }
    }

    const root = {};
    const retroacted = [];
    for (let event of [].concat(events).sort((a, b) => b.time - a.time)) {
      if (event.action === FilerEvents.Create ||
        event.action === FilerEvents.Delete
      ) {
        const filepath = event.filename.split('/').filter(n => n !== '');
        if (!find(filepath, root)) {
          set(filepath, true, root);
          retroacted.unshift(event);
        }
      }
      else if (event.action === FilerEvents.Move) {
        const srcpath = event.src.split('/').filter(n => n !== '');
        const dstpath = event.dst.split('/').filter(n => n !== '');
        set(srcpath, find(dstpath, root), root);
        set(dstpath, true, root);
        retroacted.unshift(event);
      }
      else {
        throw Error(`Unknown action: ${event.action}`);
      }
    }
    return retroacted;
  }

  getSyncInfo = async () => {
    const { path, projectId } = this;
    const infoPath = path.join(DIRECTORY_PROJECTS, '.sync.json');
    const data = (await this.exists(infoPath))
      ? JSON.parse(await this.open(infoPath))
      : {};
    return data[projectId];
  };

  setSyncInfo = async (info) => {
    const { path, projectId } = this;
    const infoPath = path.join(DIRECTORY_PROJECTS, '.sync.json');
    const data = (await this.exists(infoPath))
      ? JSON.parse(await this.open(infoPath))
      : {};
    data[projectId] = info;
    await this.save(infoPath, JSON.stringify(data), true, { encoding: 'utf8', flag: 'w' });
  };

  getProjectRoot = () => {
    const { path, projectId } = this;
    return path.join(DIRECTORY_PROJECTS, projectId) + '/';
  }

  uploadProjectFiles = async () => {
    const { path, projectId } = this;

    const files = (await this.gatherFiles('.'));
    const tar = Tar(files);
    const gzipped = gz.compress({ buffer: tar });

    const res = await axios.post(API_PROJECT_UPLOAD, gzipped.buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Viola-API-Arg': encodeURIComponent(JSON.stringify({
          projectId,
        })),
        'X-CSRF-Token': this.session.csrfToken,
      },
      withCredentials: true,
      timeout: UPLOAD_PROJECT_TIMEOUT,
    });

    await this.setSyncInfo({
      ...await this.getSyncInfo(),
      lastSynced: Date.now(),
    });
    console.debug(`Project uploaded. projectId: ${projectId}`);
  };

  syncUpdatedFileEvents = async () => {
    const { projectId } = this;

    setTimeout(async () => {
      const targetEvents = this.stalledFilerEvents.concat(this.queuedFilerEvents);
      this.queuedFilerEvents = [];
      this.stalledFilerEvents = [];

      // Prevent to sync same file events simultaneously
      if (!this.syncingSemaphore) {
        return;
      }
      this.syncingSemaphore -= 1;
      try {
        const retroactiveEvents = SyncManager.retroactFilerEvents(targetEvents);
        const files = retroactiveEvents.filter(e => e.id in this.unsyncedFiles)
          .map(e =>
            this.unsyncedFiles[e.id].map(f =>
              Object.assign({}, f, {
                name: `${e.id}/${f.name}`,
              })
            )
          ).reduce((acc, val) => acc.concat(val), []);
        const tar = Tar(files);
        const gzipped = gz.compress({ buffer: tar });

        // transmit updated files
        const res = await axios.post(API_PROJECT_COMMIT, gzipped.buffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Viola-API-Arg': encodeURIComponent(JSON.stringify({
              projectId,
              events: retroactiveEvents,
            })),
            'X-CSRF-Token': this.session.csrfToken,
          },
          withCredentials: true,
          timeout: UPLOAD_PROJECT_TIMEOUT,
        });
        console.log('res>>>', res);

        // purge unsynced files
        this.unsyncedFiles = targetEvents.filter(e => e.id in this.unsyncedFiles)
          .reduce((acc, val) => {
            delete acc[val.id];
            return acc;
          }, this.unsyncedFiles);
        await this.setSyncInfo({
          ...await this.getSyncInfo(),
          lastSynced: Math.max(targetEvents.map(e => e.time)),
        });
        console.debug(`Project commited. projectId: ${projectId} `);
      } catch (err) {
        if (err.response) {
          console.debug(`Commit request stalled. (${err.response.status})`);
        } else {
          console.error(err);
        }
        this.stalledFilerEvents = this.stalledFilerEvents.concat(targetEvents);
      } finally {
        this.syncingSemaphore += 1;
      }
    }, 10);
  };

  handleFileChange = async filename => {
    const projectRoot = this.getProjectRoot();
    if (!filename.startsWith(projectRoot)) {
      return;
    }
    const id = shortid.generate();
    this.unsyncedFiles[id] = await this.gatherFiles(filename.replace(projectRoot, ''));
    this.queuedFilerEvents.push({
      id,
      action: FilerEvents.Create,
      time: Date.now(),
      filename: filename.replace(projectRoot, ''),
    });
  };

  handleFileDelete = async filename => {
    const projectRoot = this.getProjectRoot();
    if (!filename.startsWith(projectRoot)) {
      return;
    }
    this.queuedFilerEvents.push({
      id: shortid.generate(),
      action: FilerEvents.Delete,
      time: Date.now(),
      filename: filename.replace(projectRoot, ''),
    });
  };

  handleFileRename = async (oldFilename, newFilename) => {
    const projectRoot = this.getProjectRoot();
    if (!oldFilename.startsWith(projectRoot) || !newFilename.startsWith(projectRoot)) {
      return;
    }
    this.queuedFilerEvents.push({
      id: shortid.generate(),
      action: FilerEvents.Move,
      time: Date.now(),
      src: oldFilename.replace(projectRoot, ''),
      dst: newFilename.replace(projectRoot, ''),
    });
  };

  handleFolderRename = async ({ oldPath, newPath, children }) => {
    const projectRoot = this.getProjectRoot();
    if (!oldPath.startsWith(projectRoot) || !newPath.startsWith(projectRoot)) {
      return;
    }
    this.queuedFilerEvents.push({
      id: shortid.generate(),
      action: FilerEvents.Move,
      time: Date.now(),
      src: oldPath.replace(projectRoot, ''),
      dst: newPath.replace(projectRoot, ''),
    });
  };

  gatherFiles = async (dirname) => {
    const { path, fs } = this;
    const projectRoot = this.getProjectRoot();
    const files = [];
    const add = async (name) => {
      const stats = await this.stat(path.join(projectRoot, name));
      if (stats.type === 'DIRECTORY') {
        const files = await this.readdir(path.join(projectRoot, name));
        await Promise.all(
          files.map(f => add(path.join(name, f)))
        );
      } else {
        const content = await this.open(path.join(projectRoot, name), { encoding: null });
        files.push({ name, content });
      }
    }
    await add(dirname);
    return files;
  };
}

export class ProjectManager extends FilerImpl {

  initialize = async ({
    path,
    fs,
    sh,
    FilerBuffer,
    role,
    projectMeta,
    routeAction,
  }) => {
    this.path = path;
    this.fs = fs;
    this.sh = sh;
    this.FilerBuffer = FilerBuffer;
    this.projectMeta = projectMeta;
    this.projectRoot = null;
    this.syncManager = null;

    // fetch session info
    const res = await fetch(API_SESSION, {
      credentials: 'include',
    });
    const session = await res.json();
    this.session = session;
    this.client = new GraphQLClient(API_GRAPHQL, {
      headers: {
        'X-CSRF-Token': this.session.csrfToken,
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (routeAction.role === 'project') {
      const { projectId } = routeAction;
      this.syncManager = new SyncManager({ path, fs, sh, FilerBuffer, session, projectId });
      await this.initializeWithProjectId(projectId);
    }
    else if (routeAction.role === 'template-unofficial') {

    }
    else if (routeAction.role === 'template-official') {
      const { templateName } = routeAction;
      await this.setupWithTemplate(templateName);
    }
    else {
      await this.initializeDemoProject();
    }
  };

  setupFileWatcher = (bramble) => {
    bramble.on('projectSaved', async (evt) => {
      // await this.touchProject();
      await this.syncProject();
    });

    bramble.on('fileChange', async filename => {
      if (this.syncManager) {
        this.syncManager.handleFileChange(filename);
      }
    });
    bramble.on('fileDelete', filename => {
      if (this.syncManager) {
        this.syncManager.handleFileDelete(filename);
      }
    });
    bramble.on('fileRename', (oldFilename, newFilename) => {
      if (this.syncManager) {
        this.syncManager.handleFileRename(oldFilename, newFilename);
      }
    });
    bramble.on('folderRename', ({ oldPath, newPath, children }) => {
      if (this.syncManager) {
        this.syncManager.handleFolderRename({ oldPath, newPath, children });
      }
    });
  }

  // touchProject = async () => {
  //   const { sh, projectRoot } = this;
  //   if (!projectRoot) {
  //     return;
  //   }
  //   return new Promise((res, rej) => {
  //     sh.touch(projectRoot, { updateOnly: true }, err => {
  //       if (err) rej(err);
  //       else res();
  //     });
  //   });
  // };

  syncProject = async () => {
    await this.syncManager.syncUpdatedFileEvents();
  };

  initializeWithProjectId = async (projectId) => {
    const { path } = this;

    if (!this.session.user) {
      throw new NotLoggedInError('Not logged in');
    }
    const { projects } = await this.client.request(`
      query {
        projects {
          id updatedAt title projectMeta
        }
      }
    `);

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new ProjectNotFoundError('Project not found');
    }

    let { projectMeta } = project;
    if (typeof projectMeta === 'string') {
      projectMeta = await this.getMeta(projectMeta);
    }
    const projectRoot = path.join(DIRECTORY_PROJECTS, projectId);
    if (!(await this.exists(path.join(DIRECTORY_PROJECTS)))) {
      console.debug(`Downloading project files... projectId: ${projectId}`);
      await this.setupProjectFile(projectId, projectRoot);
    } else {
      const localSyncInfo = await this.syncManager.getSyncInfo();
      const remoteTimestamp = new Date(project.updatedAt);

      if (localSyncInfo
        && remoteTimestamp > new Date(localSyncInfo.lastSynced)
      ) {
        console.debug(`Updating project files... projectId: ${projectId}`);
        await this.removeFile(projectRoot, true);
        await this.setupProjectFile(projectId, projectRoot);
      }
    }
    this.projectRoot = projectRoot;
    Bramble.mount(projectRoot);
  };

  initializeDemoProject = async () => {
    const { path, projectMeta } = this;

    const stats = await this.stat(DIRECTORY_BATA_PROJECT);
    if (stats && stats.type === 'DIRECTORY') {
      // use existing beta project as demo project
      await this.rename(DIRECTORY_BATA_PROJECT, DIRECTORY_DEMO_PROJECT);
    }

    const projectRootExists = await this.exists(DIRECTORY_DEMO_PROJECT);
    if (!projectRootExists) {
      console.debug(`Downloading demo project files... metafile: ${projectMeta}`);
      const meta = await this.getMeta(projectMeta);
      await this.setupWithMetaFile(meta, path.dirname(projectMeta), DIRECTORY_DEMO_PROJECT);
    }
    this.projectRoot = DIRECTORY_DEMO_PROJECT;
    Bramble.mount(DIRECTORY_DEMO_PROJECT);
  };

  getMeta = async (metaURL) => {
    const res = await fetch(metaURL);
    if (!res.ok) {
      throw Error(`${this.projectMeta} returns ${res.status}`);
    }
    return await res.json();
  };

  setupWithMetaFile = async (meta, src, dst) => {
    const { path, FilerBuffer } = this;

    // get project files
    const sourceFileList = meta.files.map(p => {
      return path.join(src, p);
    });
    const fileRes = await Promise.all(
      sourceFileList.map(p => fetch(p))
    );

    // check project file status
    const fileBuffer = [];
    for (let i=0; i < fileRes.length; i++) {
      const res = fileRes[i];
      const sourcePath = sourceFileList[i];
      if (!res.ok) {
        throw Error(`${sourcePath} returns ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      fileBuffer.push(buffer);
    }

    // save project file
    await this.mkdirp(dst);
    await Promise.all(
      fileBuffer.map(async (buffer, i) => {
        const filename = meta.files[i];
        const destPath = path.join(dst, filename);
        await this.save(destPath, new FilerBuffer(buffer));
      })
    );
  };

  setupProjectFile = async (projectId, dst) => {
    const { path, FilerBuffer } = this;

    const res = await axios.post(API_PROJECT_DOWNLOAD, null, {
      headers: {
        'Viola-API-Arg': encodeURIComponent(JSON.stringify({
          projectId,
        })),
        'X-CSRF-Token': this.session.csrfToken,
      },
      withCredentials: true,
      responseType: 'arraybuffer',
      timeout: DOWNLOAD_PROJECT_TIMEOUT,
    });
    const tar = gz.decompress({ buffer: res.data });
    const extractedFiles = await new Promise((res, rej) => {
      // js-unter returns original Promise object
      untar(tar.buffer).then(res).catch(rej);
    });

    await this.mkdirp(dst);
    await Promise.all(
      extractedFiles.map(async file => {
        if (file.size > 0) {
          const destPath = path.join(dst, file.name);
          await this.save(destPath, new FilerBuffer(file.buffer));
        }
      })
    );
  };

  setupWithTemplate = async (templateName) => {
    const { path, fs, sh, FilerBuffer, session } = this;
    const { template } = await this.client.request(`
      query template($templateName: String!) {
        template(screenName: $templateName) {
          projectMeta
          title
        }
      }
    `, { templateName });
    if (!template) {
      throw new TemplateNotFoundError('Template not found');
    }
    const { projectMeta, title } = template;

    if (this.session.user) {
      // Create new project and setup template
      const { createProject } = await this.client.request(`
        mutation createProject($title: String!, $projectMeta: Json!) {
          createProject(title: $title, projectMeta: $projectMeta) {
            id title
          }
        }
      `, {
        title,
        projectMeta: {
          files: [],
        },
      });
      if (!createProject) {
        throw new Error('Failed to create project');
      }

      const projectRoot = path.join(DIRECTORY_PROJECTS, createProject.id);
      this.projectRoot = projectRoot;
      this.syncManager = new SyncManager({
        path, fs, sh, FilerBuffer, session,
        projectId: createProject.id,
      });
      const meta = await this.getMeta(projectMeta);
      console.debug(`Downloading template files... metafile: ${projectMeta}`);
      await this.setupWithMetaFile(meta, path.dirname(projectMeta), projectRoot);
      await this.syncManager.uploadProjectFiles();

      window.history.replaceState('', null, `/project/${createProject.id}`);
      Bramble.mount(projectRoot);
    }
    else {
      // Setup as demo project
      const meta = await this.getMeta(projectMeta);
      if (await this.exists(DIRECTORY_DEMO_PROJECT)) {
        await this.removeFile(DIRECTORY_DEMO_PROJECT, true);
      }

      console.debug(`Downloading template files... metafile: ${projectMeta}`);
      await this.setupWithMetaFile(meta, path.dirname(projectMeta), DIRECTORY_DEMO_PROJECT);

      window.history.replaceState('', null, '/');
      this.projectRoot = DIRECTORY_DEMO_PROJECT;
      Bramble.mount(DIRECTORY_DEMO_PROJECT);
    }
  };
};
