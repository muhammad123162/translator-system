/**
 * Wraps an async Express handler so any rejected promise is forwarded
 * to next(err) automatically. Without this, every controller would
 * need its own try/catch — repetitive and easy to forget (DRY).
 *
 * Usage: router.get('/', asyncHandler(controller.list));
 */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
