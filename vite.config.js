import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
  },
  plugins: [
    {
      name: 'html-rewrite-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0];
          if (url === '/collection') {
            req.url = req.url.replace('/collection', '/collection.html');
          } else if (url === '/about') {
            req.url = req.url.replace('/about', '/about.html');
          } else if (url === '/contact') {
            req.url = req.url.replace('/contact', '/contact.html');
          } else if (url.startsWith('/product/')) {
            req.url = '/product.html' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
          } else if (url === '/desktop.html') {
            req.url = '/index.html';
          }
          next();
        });
      }
    }
  ]
});
