import { useEffect, useState } from 'react';

// '#/sheets/blind75?section=Graphs' -> { page: 'sheets', arg: 'blind75', params }
const parse = () => {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
  const [page = 'status', arg = ''] = path.split('/');
  return { page: page || 'status', arg, params: new URLSearchParams(query) };
};

export const go = (path) => {
  window.location.hash = `#/${path}`;
};

export function useHashRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
