const target = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

module.exports = {
  '/api': {
    target,
    changeOrigin: true,
    // The backend takes the client IP for the login rate limit from X-Forwarded-For.
    // Sockets are not rate limited, so /socket.io does not need it.
    xfwd: true,
    pathRewrite: { '^/api': '' },
  },
  '/socket.io': {
    target,
    changeOrigin: true,
    ws: true,
  },
};
