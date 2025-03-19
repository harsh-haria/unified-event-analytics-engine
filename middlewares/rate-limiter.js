const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10, // maximum number of requests allowed in the windowMs
  message: 'Too many requests, please try again later.',
});

module.exports = limiter;