const NodeCache = require('node-cache');

// TTL: 300 seconds (5 minutes). Analytics data doesn't change every second.
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Builds a cache key from a prefix and query params object.
 * e.g. cacheKey('summary', req.query) => "summary:department=1&semester=2"
 */
const buildKey = (prefix, params = {}) => {
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    return `${prefix}:${sorted}`;
};

/**
 * Middleware wrapper: checks cache before running handler.
 * Usage: router.get('/path', withCache('myKey'), handler)
 */
const withCache = (prefix) => (req, res, next) => {
    const key = buildKey(prefix, req.query);
    const cached = cache.get(key);
    if (cached !== undefined) {
        return res.json({ ...cached, _cached: true });
    }
    // Monkey-patch res.json to intercept and cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode < 400 && body?.success) {
            cache.set(key, body);
        }
        return originalJson(body);
    };
    next();
};

/**
 * Invalidates all keys that start with a given prefix.
 * Call this after any data mutation (e.g., new feedback submitted).
 */
const invalidate = (prefix) => {
    const keys = cache.keys().filter(k => k.startsWith(prefix));
    cache.del(keys);
};

module.exports = { cache, buildKey, withCache, invalidate };
