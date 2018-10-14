import { getLocaleKeyByApplicableObj } from '../withIntl';

// prettier-ignore
const demoProjectMetaFiles = {
  ja: 'https://raw.githubusercontent.com/violapub/templates/master/welcome-ja/meta.toml',
};
const defaultProjectMeta =
  'https://raw.githubusercontent.com/violapub/templates/master/welcome-en/meta.toml';

export default function route() {
  const { pathname } = window.location;

  let match;

  match = pathname.match(/^\/project\/([0-9a-zA-Z]+)\/?$/);
  if (match) {
    return {
      role: 'project',
      projectId: match[1],
    };
  }

  match = pathname.match(/^\/template\/(https?:\/\/.+)$/);
  if (match) {
    return {
      role: 'template-unofficial',
      url: match[1],
    };
  }

  match = pathname.match(/^\/template\/([0-9a-zA-Z_-]+)\/?$/);
  if (match) {
    return {
      role: 'template-official',
      templateName: match[1],
    };
  }

  // fallback to root page
  else if (pathname !== '/') {
    window.history.replaceState('', null, '/');
  }
  const localeTag = getLocaleKeyByApplicableObj(demoProjectMetaFiles);
  const projectMeta = localeTag? demoProjectMetaFiles[localeTag] : defaultProjectMeta;
  return {
    role: 'demo',
    projectMeta,
  };
}
