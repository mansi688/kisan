/**
 * Express 4 doesn't forward a rejected promise from an async handler to
 * the error-handling middleware — it just crashes the request silently.
 * Wrapping every handler in this makes `await readCollection(...)` (now
 * async under the Postgres driver) behave the same as any other error path
 * already handled by server.js's error middleware.
 */
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
