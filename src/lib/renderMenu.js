import { formatPrice } from './menu.js';

const TEMPLATE_CONFIG = {
  trattoria: {
    eyebrow: 'CARTA EDITORIAL',
    defaultColor: '#9B2226',
    themeColorMeta: '#faf5ec',
    listTitle: 'Tu Comanda',
    numbering: 'roman',
    dottedLeader: true,
  },
  maiz: {
    eyebrow: 'COCINA DE ORIGEN',
    defaultColor: '#1B5E20',
    themeColorMeta: '#f4efe4',
    listTitle: 'Mi Lista de Pedido',
    numbering: 'numeric',
    dottedLeader: false,
  },
  waffle: {
    eyebrow: 'MENÚ DEL DÍA',
    defaultColor: '#D97706',
    themeColorMeta: '#fffbf2',
    listTitle: 'Mi Pedido',
    numbering: 'none',
    dottedLeader: false,
  },
  nocturno: {
    eyebrow: 'CARTA NOCTURNA',
    defaultColor: '#C89B54',
    themeColorMeta: '#14110f',
    listTitle: 'Selección de Mesa',
    numbering: 'none',
    dottedLeader: false,
  },
};

function toRoman(num) {
  const numerals = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let n = num;
  let out = '';
  for (const [val, sym] of numerals) {
    while (n >= val) {
      out += sym;
      n -= val;
    }
  }
  return out || String(num);
}

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function resolveTemplate(plantilla) {
  return TEMPLATE_CONFIG[plantilla] ? plantilla : 'trattoria';
}

function formatCategoryPrefix(numbering, index) {
  if (numbering === 'roman') return `${toRoman(index + 1)}. `;
  if (numbering === 'numeric') return `${String(index + 1).padStart(2, '0')} · `;
  return '';
}

function whatsappHref(telefono, restauranteNombre, items, total) {
  const digits = String(telefono || '').replace(/\D+/g, '');
  if (digits.length < 10) return '';
  const phone = digits.length === 10 ? `52${digits}` : digits;
  const lines = items.map((i) => `• ${i.qty}x ${i.nombre} (${formatPrice(Number(i.precio) * i.qty)})`);
  const text = `Hola ${restauranteNombre}, quisiera pedir:\n${lines.join('\n')}\nTotal estimado: ${formatPrice(total)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function renderMenu(app, { restaurante, categorias = [] }) {
  const templateId = resolveTemplate(restaurante.plantilla);
  const cfg = TEMPLATE_CONFIG[templateId];
  const color = /^#[0-9a-fA-F]{3,8}$/.test(restaurante.temaColor || '') ? restaurante.temaColor : cfg.defaultColor;

  document.documentElement.dataset.template = templateId;
  document.documentElement.style.setProperty('--accent', color);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', cfg.themeColorMeta);
  document.title = `${restaurante.nombre} · Menú`;

  const allProducts = categorias.flatMap((c) => c.productos || []);
  const expanded = new Set();
  const orderQty = new Map();
  let activeCategoryId = categorias[0]?.id || (categorias[0] ? 'cat-0' : '');
  let drawerOpen = false;

  // Pre-expand first dish with an image (if any) so diners see how details look
  const firstWithPhoto = allProducts.find((p) => p.imagenUrl);
  if (firstWithPhoto?.id) expanded.add(firstWithPhoto.id);

  function catDomId(cat, index) {
    return `cat-${cat.id || index}`;
  }

  function prodKey(prod, catIdx, prodIdx) {
    return prod.id || `p-${catIdx}-${prodIdx}`;
  }

  function getOrderSummary() {
    const items = [];
    let count = 0;
    let total = 0;
    categorias.forEach((cat, ci) => {
      (cat.productos || []).forEach((prod, pi) => {
        const key = prodKey(prod, ci, pi);
        const qty = orderQty.get(key) || 0;
        if (qty > 0) {
          items.push({ ...prod, _key: key, qty });
          count += qty;
          total += qty * Number(prod.precio || 0);
        }
      });
    });
    return { items, count, total };
  }

  // Persistent DOM references
  const shell = el('div', 'menu-shell');
  shell.dataset.template = templateId;

  // 1. Fixed Category Navbar
  let navEl = null;
  const navButtons = new Map();

  function updateNavHighlight() {
    for (const [id, btn] of navButtons.entries()) {
      const isCurrent = id === activeCategoryId;
      btn.classList.toggle('is-active', isCurrent);
      btn.setAttribute('aria-current', isCurrent ? 'true' : 'false');
    }
  }

  if (categorias.length > 0) {
    navEl = el('nav', 'cat-nav');
    navEl.setAttribute('aria-label', 'Categorías del menú');

    const navInner = el('div', 'cat-nav-inner');
    const topBtn = el('button', 'cat-nav-top', '↑');
    topBtn.type = 'button';
    topBtn.title = 'Ir al inicio de la carta';
    topBtn.setAttribute('aria-label', 'Ir al inicio de la carta');
    topBtn.addEventListener('click', () => {
      activeCategoryId = catDomId(categorias[0], 0);
      updateNavHighlight();
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    navInner.append(topBtn);

    const navList = el('div', 'cat-nav-list');
    categorias.forEach((cat, idx) => {
      const id = catDomId(cat, idx);
      const btn = el('button', 'cat-nav-btn', `${formatCategoryPrefix(cfg.numbering, idx)}${cat.nombre}`);
      btn.type = 'button';
      btn.dataset.target = id;
      btn.addEventListener('click', () => {
        activeCategoryId = id;
        updateNavHighlight();
        const target = document.getElementById(id);
        if (target && typeof window.scrollTo === 'function') {
          const navH = navEl.offsetHeight || 48;
          const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
      });
      navButtons.set(id, btn);
      navList.append(btn);
    });

    navInner.append(navList);
    navEl.append(navInner);
    updateNavHighlight();
  }

  // 2. Editorial Cover Header
  const sheet = el('div', 'menu-sheet');
  if (templateId === 'maiz') {
    sheet.append(el('div', 'maiz-top-bar'));
  }

  const header = el('header', 'hero');
  if (restaurante.logoUrl) {
    const logo = el('img', 'logo');
    logo.src = restaurante.logoUrl;
    logo.alt = `Logo de ${restaurante.nombre}`;
    header.append(logo);
  }
  const heroCopy = el('div', 'hero-copy');
  heroCopy.append(
    el('p', 'eyebrow', cfg.eyebrow),
    el('h1', 'restaurant-title', restaurante.nombre)
  );
  if (restaurante.telefono) {
    heroCopy.append(el('p', 'tagline', `Tel. ${restaurante.telefono}`));
  }
  header.append(heroCopy);

  // 3. Content container (re-rendered on expand/qty changes)
  const content = el('div', 'content');

  // 4. Floating Order Bar & Drawer
  const orderBarWrap = el('div', 'order-bar-wrap');
  const drawerBackdrop = el('div', 'order-drawer-backdrop');
  drawerBackdrop.hidden = true;
  drawerBackdrop.addEventListener('click', () => {
    drawerOpen = false;
    renderOrderUI();
  });

  function setQty(key, delta) {
    const next = Math.max(0, (orderQty.get(key) || 0) + delta);
    if (next === 0) orderQty.delete(key);
    else orderQty.set(key, next);
    renderDishes();
    renderOrderUI();
  }

  function renderOrderUI() {
    const { items, count, total } = getOrderSummary();

    // Floating bottom bar
    orderBarWrap.replaceChildren();
    if (allProducts.length > 0) {
      const barBtn = el('button', 'order-bar');
      barBtn.type = 'button';
      barBtn.setAttribute('aria-label', `Abrir ${cfg.listTitle}`);

      const left = el('span', 'order-bar-left');
      left.append(
        el('span', 'order-count', String(count)),
        el('span', 'order-label', cfg.listTitle)
      );
      const right = el('span', 'order-bar-right');
      right.append(
        el('span', 'order-total', formatPrice(total)),
        el('span', 'order-chevron', 'Ver ›')
      );
      barBtn.append(left, right);
      barBtn.addEventListener('click', () => {
        drawerOpen = true;
        renderOrderUI();
      });
      orderBarWrap.append(barBtn);
    }

    // Drawer
    drawerBackdrop.hidden = !drawerOpen;
    drawerBackdrop.replaceChildren();
    if (!drawerOpen) return;

    const drawer = el('div', 'order-drawer');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', cfg.listTitle);
    drawer.addEventListener('click', (e) => e.stopPropagation());

    const dHead = el('div', 'order-drawer-head');
    const dTitleWrap = el('div');
    dTitleWrap.append(
      el('p', 'order-drawer-eyebrow', restaurante.nombre),
      el('h2', 'order-drawer-title', cfg.listTitle)
    );
    const closeBtn = el('button', 'order-btn-ghost', 'Cerrar');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => {
      drawerOpen = false;
      renderOrderUI();
    });
    dHead.append(dTitleWrap, closeBtn);

    const dBody = el('div', 'order-drawer-body');
    if (items.length === 0) {
      dBody.append(
        el('p', 'order-empty', 'Aún no has guardado platillos. Toca cualquier platillo de la carta para agregarlo.')
      );
    } else {
      for (const item of items) {
        const row = el('div', 'order-row');
        const info = el('div', 'order-row-info');
        info.append(
          el('strong', 'order-row-name', item.nombre),
          el('small', 'order-row-sub', `${formatPrice(item.precio)} c/u · ${formatPrice(Number(item.precio) * item.qty)}`)
        );
        const stepper = el('div', 'qty-stepper');
        const dec = el('button', 'qty-btn', '−');
        dec.type = 'button';
        dec.setAttribute('aria-label', `Quitar ${item.nombre}`);
        dec.addEventListener('click', () => setQty(item._key, -1));
        const val = el('span', 'qty-val', String(item.qty));
        const inc = el('button', 'qty-btn', '+');
        inc.type = 'button';
        inc.setAttribute('aria-label', `Agregar otro ${item.nombre}`);
        inc.addEventListener('click', () => setQty(item._key, 1));
        stepper.append(dec, val, inc);
        row.append(info, stepper);
        dBody.append(row);
      }
    }

    const dFoot = el('div', 'order-drawer-foot');
    const sumRow = el('div', 'order-sum-row');
    sumRow.append(
      el('span', 'order-sum-label', `Total estimado (${count} ${count === 1 ? 'platillo' : 'platillos'})`),
      el('strong', 'order-sum-total', formatPrice(total))
    );
    const actions = el('div', 'order-drawer-actions');
    if (items.length > 0) {
      const clearBtn = el('button', 'order-btn-ghost', 'Limpiar');
      clearBtn.type = 'button';
      clearBtn.addEventListener('click', () => {
        orderQty.clear();
        renderDishes();
        renderOrderUI();
      });
      actions.append(clearBtn);

      const waUrl = whatsappHref(restaurante.telefono, restaurante.nombre, items, total);
      if (waUrl) {
        const waLink = el('a', 'order-btn-primary', 'Enviar por WhatsApp');
        waLink.href = waUrl;
        waLink.target = '_blank';
        waLink.rel = 'noreferrer';
        actions.append(waLink);
      } else {
        const okBtn = el('button', 'order-btn-primary', 'Mostrar al mesero');
        okBtn.type = 'button';
        okBtn.addEventListener('click', () => {
          drawerOpen = false;
          renderOrderUI();
        });
        actions.append(okBtn);
      }
    } else {
      const okBtn = el('button', 'order-btn-primary', 'Seguir explorando');
      okBtn.type = 'button';
      okBtn.addEventListener('click', () => {
        drawerOpen = false;
        renderOrderUI();
      });
      actions.append(okBtn);
    }

    dFoot.append(sumRow, actions);
    drawer.append(dHead, dBody, dFoot);
    drawerBackdrop.append(drawer);
  }

  function renderDishes() {
    content.replaceChildren();

    if (!categorias.length) {
      content.append(el('p', 'status', 'Este restaurante aún no tiene platillos publicados.'));
      return;
    }

    // Subtle toolbar: hint + Expand/Collapse All
    if (allProducts.length > 0) {
      const toolbar = el('div', 'menu-toolbar');
      toolbar.append(el('span', 'toolbar-hint', 'Toca un platillo para ver detalles o guardarlo'));

      const allKeys = [];
      categorias.forEach((c, ci) => (c.productos || []).forEach((p, pi) => allKeys.push(prodKey(p, ci, pi))));
      const allOpen = allKeys.length > 0 && allKeys.every((k) => expanded.has(k));
      const toggleAllBtn = el('button', 'toolbar-toggle', allOpen ? 'Compactar todo' : 'Expandir todo');
      toggleAllBtn.type = 'button';
      toggleAllBtn.addEventListener('click', () => {
        if (allOpen) allKeys.forEach((k) => expanded.delete(k));
        else allKeys.forEach((k) => expanded.add(k));
        renderDishes();
      });
      toolbar.append(toggleAllBtn);
      content.append(toolbar);
    }

    categorias.forEach((categoria, catIdx) => {
      const section = el('section', 'category');
      section.id = catDomId(categoria, catIdx);

      const catHeader = el('div', 'category-head');
      if (cfg.numbering === 'roman') {
        catHeader.append(el('span', 'category-index', toRoman(catIdx + 1)));
      } else if (cfg.numbering === 'numeric') {
        catHeader.append(el('span', 'category-index', String(catIdx + 1).padStart(2, '0')));
      }
      catHeader.append(el('h2', 'category-title', categoria.nombre));
      section.append(catHeader);

      const list = el('div', 'items');
      (categoria.productos || []).forEach((producto, prodIdx) => {
        const key = prodKey(producto, catIdx, prodIdx);
        const isOpen = expanded.has(key);
        const qty = orderQty.get(key) || 0;
        const hasImage = Boolean(producto.imagenUrl);

        const card = el('article', `item${isOpen ? ' is-open' : ''}${producto.disponible ? '' : ' is-unavailable'}`);

        // Clickable compact header
        const headBtn = el('button', 'item-head');
        headBtn.type = 'button';
        headBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        headBtn.addEventListener('click', () => {
          if (expanded.has(key)) expanded.delete(key);
          else expanded.add(key);
          renderDishes();
        });

        if (hasImage && !isOpen) {
          const thumb = el('img', 'item-thumb');
          thumb.src = producto.imagenUrl;
          thumb.alt = producto.nombre;
          thumb.loading = 'lazy';
          headBtn.append(thumb);
        }

        const headMain = el('div', 'item-head-main');
        const titleRow = el('div', 'item-title-row');
        titleRow.append(el('h3', 'item-name', producto.nombre));

        if (!producto.disponible && !isOpen) {
          titleRow.append(el('span', 'sold-out', 'Agotado'));
        }

        if (cfg.dottedLeader) {
          titleRow.append(el('span', 'dotted-leader'));
        } else {
          titleRow.append(el('span', 'title-spacer'));
        }

        if (qty > 0) {
          titleRow.append(el('span', 'qty-badge', String(qty)));
        }
        titleRow.append(el('strong', 'price', formatPrice(producto.precio)));
        headMain.append(titleRow);

        if (producto.descripcion && !isOpen) {
          headMain.append(el('p', 'item-preview', producto.descripcion));
        }

        headBtn.append(headMain, el('span', 'item-chevron', isOpen ? '▴' : '▾'));
        card.append(headBtn);

        // Expanded details
        if (isOpen) {
          const body = el('div', `item-body${hasImage ? ' has-photo' : ''}`);
          if (hasImage) {
            const image = el('img', 'product-image');
            image.src = producto.imagenUrl;
            image.alt = producto.nombre;
            image.loading = 'lazy';
            body.append(image);
          }

          const copy = el('div', 'item-copy');
          if (producto.descripcion) {
            copy.append(el('p', 'description', producto.descripcion));
          }

          const actions = el('div', 'item-actions');
          if (!producto.disponible) {
            actions.append(el('span', 'sold-out', 'Agotado hoy'));
          } else if (qty === 0) {
            const addBtn = el('button', 'add-btn', '+ Guardar en mi lista');
            addBtn.type = 'button';
            addBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              setQty(key, 1);
            });
            actions.append(addBtn);
          } else {
            const stepper = el('div', 'qty-stepper');
            const dec = el('button', 'qty-btn', '−');
            dec.type = 'button';
            dec.setAttribute('aria-label', `Quitar ${producto.nombre}`);
            dec.addEventListener('click', (e) => {
              e.stopPropagation();
              setQty(key, -1);
            });
            const val = el('span', 'qty-val', String(qty));
            const inc = el('button', 'qty-btn', '+');
            inc.type = 'button';
            inc.setAttribute('aria-label', `Agregar otro ${producto.nombre}`);
            inc.addEventListener('click', (e) => {
              e.stopPropagation();
              setQty(key, 1);
            });
            stepper.append(dec, val, inc);
            actions.append(stepper);
          }

          const minBtn = el('button', 'minimize-btn', 'Minimizar');
          minBtn.type = 'button';
          minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            expanded.delete(key);
            renderDishes();
          });
          actions.append(minBtn);

          copy.append(actions);
          body.append(copy);
          card.append(body);
        }

        list.append(card);
      });

      section.append(list);
      content.append(section);
    });
  }

  // Footer
  const footer = el('footer', 'menu-footer');
  const footerParts = [];
  if (restaurante.telefono) footerParts.push(`Tel. ${restaurante.telefono}`);
  footerParts.push('Precios en MXN', 'Menú creado con AntojoLink');
  footer.textContent = footerParts.join(' · ');

  sheet.append(header, content, footer);

  if (navEl) {
    shell.classList.add('has-fixed-nav');
    shell.append(navEl);
  }
  shell.append(sheet, orderBarWrap, drawerBackdrop);

  renderDishes();
  renderOrderUI();
  app.replaceChildren(shell);

  // Scroll spy for fixed category navbar
  if (navEl && typeof window !== 'undefined') {
    const onScroll = () => {
      const offset = (navEl.offsetHeight || 48) + 36;
      let current = catDomId(categorias[0], 0);
      for (let i = 0; i < categorias.length; i += 1) {
        const id = catDomId(categorias[i], i);
        const sec = document.getElementById(id);
        if (sec && sec.getBoundingClientRect().top <= offset) {
          current = id;
        }
      }
      if (current !== activeCategoryId) {
        activeCategoryId = current;
        updateNavHighlight();
        const activeBtn = navButtons.get(current);
        if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
          activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}
