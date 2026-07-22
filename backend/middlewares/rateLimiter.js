import rateLimit from 'express-rate-limit';

// There is deliberately no general /api limiter. Normal use of the portal costs
// several requests per page, so a per-IP ceiling tight enough to stop abuse also
// blocks customers part-way through a booking. Only the credential endpoints
// below are throttled.

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
