export default class Project {

  constructor({
    path,
    fs,
    sh,
    FilerBuffer,
    projectMeta,
    projectRoot,
  }) {
    this.path = path;
    this.fs = fs;
    this.sh = sh;
    this.FilerBuffer = FilerBuffer;
    this.projectMeta = projectMeta;
    this.projectRoot = projectRoot;
  }

  initialize = async () => {
    if (!this.projectRoot) {
      throw Error('projectRoot is not defined');
    }

    const projectRootExists = await this.exists(this.projectRoot);
    if (!projectRootExists) {
      console.debug(`Downloading project file... metafile: ${this.projectMeta}`);
      await this.download();
    }
  };

  download = async () => {
    const { path, FilerBuffer } = this;
    if (!this.projectRoot) {
      throw Error('projectRoot is not defined');
    }

    if (this.projectMeta) {
      // get meta.json
      const res = await fetch(this.projectMeta);
      if (!res.ok) {
        throw Error(`${this.projectMeta} returns ${res.status}`);
      }
      const meta = await res.json();

      // get project files
      const sourceFileList = meta.files.map(p => {
        return path.join(path.dirname(this.projectMeta), p);
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
          const destPath = path.join(this.projectRoot, filename);
          await this.save(destPath, new FilerBuffer(buffer));
        })
      );
    }
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

  exists = (path) => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.exists(path, exists => res(exists));
    });
  };

  mkdirp = (dirname) => {
    const { sh } = this;
    return new Promise((res, rej) => {
      sh.mkdirp(dirname, err => {
        if (err) {
          rej(err);
        } else {
          res(dirname);
        }
      });
    });
  };

  writeFile = async (filename, data) => {
    const { fs } = this;
    return new Promise((res, rej) => {
      fs.writeFile(filename, data, err => {
        if (err) {
          rej(err);
        } else {
          res(data);
        }
      })
    })
  };
};
