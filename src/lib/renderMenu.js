import { formatPrice } from './menu.js';

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function renderMenu(app, { restaurante, categorias }) {
  const color = /^#[0-9a-fA-F]{3,8}$/.test(restaurante.temaColor || '') ? restaurante.temaColor : '#bd4b2b';
  document.documentElement.style.setProperty('--accent', color);
  document.title = `${restaurante.nombre} · Menú`;
  const header = el('header', 'hero');
  if (restaurante.logoUrl) {
    const logo = el('img', 'logo'); logo.src = restaurante.logoUrl; logo.alt = `Logo de ${restaurante.nombre}`; header.append(logo);
  }
  header.append(el('p', 'eyebrow', 'MENÚ DIGITAL'), el('h1', '', restaurante.nombre), el('p', 'tagline', 'Elige algo delicioso para hoy'));
  const content = el('div', 'content');
  if (!categorias.length) content.append(el('p', 'status', 'Este restaurante aún no tiene platillos publicados.'));
  for (const categoria of categorias) {
    const section = el('section', 'category');
    section.append(el('h2', '', categoria.nombre));
    const list = el('div', 'items');
    for (const producto of categoria.productos || []) {
      const card = el('article', 'item');
      const copy = el('div', 'item-copy');
      copy.append(el('h3', '', producto.nombre));
      if (producto.descripcion) copy.append(el('p', 'description', producto.descripcion));
      copy.append(el('strong', 'price', formatPrice(producto.precio)));
      if (!producto.disponible) copy.append(el('span', 'sold-out', 'Agotado'));
      card.append(copy);
      if (producto.imagenUrl) {
        const image = el('img', 'product-image'); image.src = producto.imagenUrl; image.alt = producto.nombre; image.loading = 'lazy'; card.append(image);
      }
      list.append(card);
    }
    section.append(list); content.append(section);
  }
  app.replaceChildren(header, content, el('footer', '', 'Menú creado con AntojoLink'));
}
