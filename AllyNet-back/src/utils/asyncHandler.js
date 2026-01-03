/**
 * Async Handler Wrapper
 * Eliminates need for try-catch blocks in route handlers
 * Automatically passes errors to error handling middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

