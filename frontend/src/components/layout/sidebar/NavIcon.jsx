export function NavIcon({ name, className = 'w-5 h-5' }) {
  const props = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  }
  const icons = {
    home: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    ),
    check: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    truck: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7v-7zM7 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    ),
    pin: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11zm0-8a3 3 0 110-6 3 3 0 010 6z" />
    ),
    document: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 3h6l5 5v13a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zm6 0v5h5" />
    ),
    wallet: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v2H3V7zm0 4h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7zm12 3.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
    ),
    banknote: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16v10H4V7zm8 7a2 2 0 100-4 2 2 0 000 4zM7 10h.01M17 14h.01" />
    ),
    tag: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 11l8.5-8.5a2 2 0 012.8 0L21 8.2a2 2 0 010 2.8L12.5 20 4 11zm5-5.5a1.5 1.5 0 11-2.1 2.1A1.5 1.5 0 019 5.5z" />
    ),
    receipt: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5V3zm3 5h4M10 12h4M10 16h2" />
    ),
    chart: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19V5m0 14h16M8 17v-5m4 5V8m4 9v-3" />
    ),
    layers: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4l9 5-9 5-9-5 9-5zm9 8l-9 5-9-5" />
    ),
    upload: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
    ),
    folder: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    ),
    search: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.3-4.3" />
    ),
    cog: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a7.8 7.8 0 00.1-1.5 7.8 7.8 0 00-.1-1.5l2-1.5-2-3.5-2.4.5a7.4 7.4 0 00-2.6-1.5L14 3h-4l-.4 2.5a7.4 7.4 0 00-2.6 1.5L4.6 7l-2 3.5 2 1.5a7.8 7.8 0 000 3l-2 1.5 2 3.5 2.4-.5a7.4 7.4 0 002.6 1.5L10 21h4l.4-2.5a7.4 7.4 0 002.6-1.5l2.4.5 2-3.5-2-1.5z" />
    ),
    store: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9l1.5-5h15L21 9M4 9h16v11H4V9zm4 4h8" />
    ),
    logout: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12H4m0 0l4-4m-4 4l4 4m7-9V5a2 2 0 012-2h4a2 2 0 012 2v14a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2" />
    ),
    chevronLeft: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
    ),
    chevronRight: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
    ),
    chevronDown: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9l6 6 6-6" />
    ),
    menu: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
    ),
    close: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
    ),
  }

  return <svg {...props}>{icons[name] || icons.document}</svg>
}

export function isNavActive(to, location, { end = false } = {}) {
  const [path, query = ''] = String(to).split('?')
  if (location.pathname !== path) return false
  const wanted = new URLSearchParams(query)
  const current = new URLSearchParams(location.search)

  if ([...wanted.keys()].length > 0) {
    return [...wanted.entries()].every(([key, value]) => current.get(key) === value)
  }

  if (end) return true
  if (path === '/administrador' && current.get('tab')) return false
  if (path === '/manifiestos' && current.get('section')) return false
  return true
}
