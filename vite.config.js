// Local dev only (`npm run dev:static`): serve the static pages on :5173 and
// forward /api to the Express API (`npm run dev:api`), which listens with a
// self-signed HTTPS certificate on :3000. Production uses vercel.json instead.
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false, // accept the API's self-signed dev certificate
      },
    },
  },
};
