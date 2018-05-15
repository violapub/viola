import { GraphQLClient } from 'graphql-request';
import Tar from 'tarts';
import * as gz from 'jsziptools/gz';
import { NotLoggedInError, ProjectNotFoundError } from './error';

const {
  REACT_APP_CELLO_HOST_URL,
} = process.env;

const API_SESSION = REACT_APP_CELLO_HOST_URL + '/auth/session';
const API_GRAPHQL = REACT_APP_CELLO_HOST_URL + '/graphql'
const DIRECTORY_PROJECTS = '/viola/project';
const DIRECTORY_DEMO_PROJECT = '/viola/demo';
const DIRECTORY_BATA_PROJECT = '/viola/beta';

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

class SyncManager extends FilerImpl {
  constructor(args) {
    super(args);
    const { path, fs, sh, FilerBuffer, projectId } = args;
    this.path = path;
    this.fs = fs;
    this.sh = sh;
    this.FilerBuffer = FilerBuffer;
    this.projectId = projectId;
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
  }

  syncData = async () => {
    const { path, projectId } = this;
    const projectRoot = path.join(DIRECTORY_PROJECTS, projectId);

    const files = (await this.gatherFiles(projectRoot))
      .map(f => {
        f.name = f.name.replace(projectRoot + '/', '');
        return f;
      });
    const tar = Tar(files);
    const gzipped = gz.compress({ buffer: tar });

    // transmission code here

    const info = await this.getSyncInfo();
    await this.setSyncInfo({
      ...info,
      lastSynced: Date.now(),
    });
    console.debug(`Project synced. projectId: ${projectId}`);
    const url = URL.createObjectURL(new Blob([gzipped], { type: 'application/gzip' }));
    console.debug(url);
  }

  gatherFiles = async (dirname) => {
    const { path, fs } = this;
    const files = [];
    const add = async (name) => {
      const stats = await this.stat(name);
      if (stats.type === 'DIRECTORY') {
        const files = await this.readdir(name);
        await Promise.all(
          files.map(f => add(path.join(name, f)))
        );
      } else {
        const content = await this.open(name, { encoding: null });
        files.push({ name, content });
      }
    }
    await add(dirname);
    return files;
  };
}

export default class Project extends FilerImpl {

  initialize = async ({
    path,
    fs,
    sh,
    FilerBuffer,
    role,
    projectMeta,
    projectId,
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
    this.session = await res.json();
    this.client = new GraphQLClient(API_GRAPHQL, {
      headers: {
        'X-CSRF-Token': this.session.csrfToken,
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (role === 'project') {
      this.syncManager = new SyncManager({ path, fs, sh, FilerBuffer, projectId });
      await this.initializeWithProjectId(projectId);
    }
    else if (role === 'template') {

    }
    else {
      await this.initializeDemoProject();
    }
  };

  touchProject = async () => {
    const { sh, projectRoot } = this;
    if (!projectRoot) {
      return;
    }
    return new Promise((res, rej) => {
      sh.touch(projectRoot, { updateOnly: true }, err => {
        if (err) rej(err);
        else res();
      });
    });
  };

  syncProject = async () => {
    await this.syncManager.syncData();
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

    await this.syncManager.getSyncInfo();

    let { projectMeta } = project;
    if (typeof projectMeta === 'string') {
      projectMeta = await this.getMeta(projectMeta);
    }
    const projectRoot = path.join(DIRECTORY_PROJECTS, projectId);
    if (!(await this.exists(path.join(DIRECTORY_PROJECTS)))) {
      console.debug(`Downloading project files... projectId: ${projectId}`);
      await this.download(projectMeta, null, projectRoot);
    } else {
      const stat = await this.stat(projectRoot);
      const localTimestamp = new Date(stat.mtime);
      const remoteTimestamp = new Date(project.updatedAt);
      if (remoteTimestamp > localTimestamp) {
        console.debug(`Updating project files... projectId: ${projectId}`);
        await this.removeFile(projectRoot, true);
        await this.download(projectMeta, null, projectRoot);
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
      await this.download(meta, path.dirname(projectMeta), DIRECTORY_DEMO_PROJECT);
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

  download = async (meta, src, dst) => {
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
};
