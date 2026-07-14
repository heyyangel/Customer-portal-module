import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100, 
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Brute-force guard for the UNAUTHENTICATED credential endpoints only (login,
// register). Do not mount this on the whole auth router: /me is an authenticated
// session check that the SPA fires on every page load, and counting it as a login
// attempt drains this budget during normal use.
// Successful requests are not counted, so a legitimate user typing the right
// password never eats into their own budget — only failures do.
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts from this IP, please try again after an hour'
  }
});
