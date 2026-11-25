# AntojoLink · Menú público

Frontend Astro del ticket [#8](https://github.com/antojolink/sass-core/issues/8). Consulta el backend desde el navegador usando el primer segmento de la ruta como slug.

```bash
cp .env.example .env
npm ci
npm run dev
```

Usa Node 24. Abre `http://localhost:4321/tacos-pepe` en el servidor Astro local con `sass-core` ejecutándose en `http://localhost:3000` y su seed cargado. La ruta publicada será `https://menu.<dominio>/tacos-pepe`. `PUBLIC_API_URL` apunta a la API correspondiente al ambiente. `npm test` ejecuta Vitest; `npm run build` crea `dist/` para S3.

Para cargar el seed con Docker Desktop abierto: en `sass-core`, ejecuta `docker compose up --build -d` y luego `docker compose exec api npm run seed`.

En S3/CloudFront, las rutas `/<slug>` deben servir `/index.html` (SPA fallback) y el backend debe permitir el origen del menú en CORS.
