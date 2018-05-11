import { GraphQLClient } from 'graphql-request';
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

export default class Project {

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
      await this.initializeWithProjectId(projectId);
    }
    else if (role === 'template') {

    }
    else {
      await this.initializeDemoProject();
    }
  };

  initializeWithProjectId = async (projectId) => {
    if (!this.session.user) {
      throw new NotLoggedInError('Not logged in');
    }
    const { projects } = await this.client.request(`
      query {
        projects {
          id updatedAt title
        }
      }
    `);

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new ProjectNotFoundError('Project not found');
    }
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
      console.debug(`Downloading project file... metafile: ${projectMeta}`);
      const meta = await this.getMeta(projectMeta);
      await this.download(meta, path.dirname(projectMeta), DIRECTORY_DEMO_PROJECT);
    }
    Bramble.mount(DIRECTORY_DEMO_PROJECT);
  }

  getMeta = async (metaURL) => {
    const res = await fetch(metaURL);
    if (!res.ok) {
      throw Error(`${this.projectMeta} returns ${res.status}`);
    }
    return await res.json();
  }

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
    await Promise.all(
      fileBuffer.map(async (buffer, i) => {
        const filename = meta.files[i];
        const destPath = path.join(dst, filename);
        await this.save(destPath, new FilerBuffer(buffer));
      })
    );
  };

  save = async (filename, data, override = false) => {
    const { path } = this;

    if (!override) {
      const fileExists = await this.exists(filename);
      if (fileExists) {
        throw Error(`file '${filename}' already exists`);
      }
    }
    await this.mkdirp(path.dirname(filename));
    await this.writeFile(filename, data);
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
  }

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
  }

  mkdirp = (dirname) => {
    const { sh } = this;
    return new Promise((res, rej) => {
      sh.mkdirp(dirname, err => {
        if (err) rej(err);
        else res(dirname);
      });
    });
  };

  writeFile = async (filename, data) => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.writeFile(filename, data, err => {
        if (err) rej(err);
        else res(data);
      });
    });
  };
};
