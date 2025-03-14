const allowedOrigins = [
  "http://localhost:" + process.env.BACKEND_PORT,
  "http://localhost:" + process.env.FRONTEND_PORT,
];

module.exports = allowedOrigins;
