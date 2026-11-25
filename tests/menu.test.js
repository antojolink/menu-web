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
    renderMenu(app, { restaurante: { nombre: 'Tacos Pepe', temaColor: '#D62828' }, categorias: [{ nombre: 'Tacos', productos: [{ nombre: 'Gringa', precio: '55.00', disponible: false }] }] });
    expect(app.textContent).toContain('Agotado');
    expect(app.textContent).toMatch(/55\.00/);
    expect(app.querySelector('.sold-out')).not.toBeNull();
  });
});
