// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { formatPrice, loadMenu, menuUrl, restaurantSlug } from '../src/lib/menu.js';
import { renderMenu } from '../src/lib/renderMenu.js';

describe('menú público', () => {
  it('extrae el slug y codifica la ruta de la API', () => {
    expect(restaurantSlug('/tacos-pepe/')).toBe('tacos-pepe');
    expect(menuUrl('http://localhost:3000/', 'tacos pepe')).toBe('http://localhost:3000/public/restaurantes/tacos%20pepe/menu');
  });

  it('formatea precios con dos decimales en MXN', () => {
    expect(formatPrice('25')).toMatch(/25\.00/);
  });

  it('distingue un restaurante inexistente', async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 404 });
    expect(await loadMenu('http://localhost:3000', 'no-existe', fetcher)).toEqual({ kind: 'missing' });
  });

  it('muestra Agotado y el precio de un producto no disponible', () => {
    const app = document.createElement('main');
    renderMenu(app, {
      restaurante: { nombre: 'Tacos Pepe', temaColor: '#D62828', plantilla: 'maiz', telefono: '3312345678' },
      categorias: [{ id: 'c1', nombre: 'Tacos', productos: [{ id: 'p1', nombre: 'Gringa', precio: '55.00', disponible: false }] }],
    });
    expect(app.textContent).toContain('Agotado');
    expect(app.textContent).toMatch(/55\.00/);
    expect(app.querySelector('.sold-out')).not.toBeNull();
    expect(app.textContent).toContain('3312345678');
    expect(document.documentElement.dataset.template).toBe('maiz');
  });

  it('renderiza navbar fija, platillos expandibles/minimizables con fotos mixtas y lista de pedido', () => {
    const app = document.createElement('main');
    renderMenu(app, {
      restaurante: { nombre: 'Trattoria Bella Napoli', temaColor: '#9B2226', plantilla: 'trattoria', telefono: '3314567890' },
      categorias: [
        {
          id: 'c1',
          nombre: 'Pizzas',
          productos: [
            { id: 'p1', nombre: 'Margherita', descripcion: 'Tomate San Marzano y albahaca.', precio: '195.00', disponible: true, imagenUrl: 'https://cdn.example/pizza.jpg' },
            { id: 'p2', nombre: 'Diavola', descripcion: 'Salami picante.', precio: '235.00', disponible: true, imagenUrl: null },
          ],
        },
      ],
    });

    // Fixed navbar present
    expect(app.querySelector('.cat-nav')).not.toBeNull();
    expect(app.querySelector('.cat-nav-btn').textContent).toContain('Pizzas');

    // First photo dish starts expanded, second starts minimized
    expect(app.querySelectorAll('.item.is-open')).toHaveLength(1);
    expect(app.querySelector('.product-image')).not.toBeNull();

    // Add first dish to order list
    app.querySelector('.add-btn').click();
    expect(app.querySelector('.order-count').textContent).toBe('1');
    expect(app.querySelector('.order-total').textContent).toMatch(/195\.00/);

    // Expand second dish (no photo) and minimize first
    app.querySelectorAll('.item-head')[1].click();
    expect(app.querySelectorAll('.item.is-open')).toHaveLength(2);

    // Open order drawer and verify WhatsApp link + subtotal
    app.querySelector('.order-bar').click();
    const drawer = app.querySelector('.order-drawer');
    expect(drawer).not.toBeNull();
    expect(drawer.textContent).toContain('Margherita');
    expect(drawer.querySelector('a.order-btn-primary').href).toContain('https://wa.me/523314567890');
  });
});
