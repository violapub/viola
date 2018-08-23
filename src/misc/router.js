export default function route() {
  const { pathname } = window.location;

  let match;

  if (match = pathname.match(/^\/project\/([0-9a-zA-Z]+)\/?$/)) {
    return {
      role: 'project',
      projectId: match[1],
    };
  }

  else if (match = pathname.match(/^\/template\/(https?:\/\/.+)$/)) {
    return {
      role: 'template-unofficial',
      url: match[1],
    };
  }

  else if (match = pathname.match(/^\/template\/([0-9a-zA-Z_-]+)\/?$/)) {
    return {
      role: 'template-official',
      templateName: match[1],
    };
  }

  // fallback to root page
  else if (pathname !== '/') {
    window.history.replaceState('', null, '/');
  }
  return { role: null };
};
