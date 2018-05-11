export default function route() {
  const { pathname } = window.location;

  let match;

  if (match = pathname.match(/^\/project\/([0-9a-zA-Z]+)\/?$/)) {
    return {
      role: 'project',
      projectId: match[1],
    };
  }

  else if (match = pathname.match(/^\/template\/(.+)$/)) {
    return {
      role: 'template',
      target: match[1],
    };
  }

  // fallback to root page
  else if (pathname !== '/') {
    if ('replaceState' in window.history) {
      window.history.replaceState('', null, '/');
    } else {
      window.location.replace('/');
    }
  }
  return { role: null };
};
