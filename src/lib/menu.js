export function restaurantSlug(pathname) {
  try { return decodeURIComponent(pathname.split('/').filter(Boolean)[0] || ''); }
  catch { return ''; }
}

export function formatPrice(value) {
  const amount = Number(value);
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

export function menuUrl(apiUrl, slug) {
  return `${apiUrl.replace(/\/$/, '')}/public/restaurantes/${encodeURIComponent(slug)}/menu`;
}

export async function loadMenu(apiUrl, slug, fetcher = fetch) {
  const response = await fetcher(menuUrl(apiUrl, slug));
  if (response.status === 404) return { kind: 'missing' };
  if (!response.ok) throw new Error('No fue posible cargar el menú.');
  return { kind: 'ready', data: await response.json() };
}
