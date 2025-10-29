export default function rateLimit({ windowMs = 60_000, max = 100, keyGenerator, skip } = {}) {
  const store = new Map(); 

  return (req, res, next) => {
    try {
      if (typeof skip === 'function' && skip(req) === true) {
        return next();
      }

      const key = (typeof keyGenerator === 'function' ? keyGenerator(req) : req.ip) || 'global';
      const now = Date.now();

      let entry = store.get(key);
      if (!entry || now >= entry.reset) {
        entry = { count: 0, reset: now + windowMs };
        store.set(key, entry);
      }

      entry.count += 1;
      const remaining = Math.max(0, max - entry.count);

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.floor(entry.reset / 1000)));

      if (entry.count > max) {
        const retryAfter = Math.max(1, Math.ceil((entry.reset - now) / 1000));
        res.setHeader('Retry-After', String(retryAfter));
        res.status(429).json({ message: 'Too many requests' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

