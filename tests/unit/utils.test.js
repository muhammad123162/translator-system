const AppError = require('../../server/utils/AppError');
const asyncHandler = require('../../server/utils/asyncHandler');

describe('AppError', () => {
  it('marks 4xx errors with status "fail"', () => {
    const err = new AppError('Bad input', 400);
    expect(err.status).toBe('fail');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
  });

  it('marks 5xx errors with status "error"', () => {
    const err = new AppError('Server exploded', 500);
    expect(err.status).toBe('error');
  });
});

describe('asyncHandler', () => {
  it('calls next(err) when the wrapped function rejects, instead of throwing unhandled', async () => {
    const failingHandler = async () => {
      throw new AppError('Something failed', 400);
    };
    const next = jest.fn();
    const wrapped = asyncHandler(failingHandler);

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
  });

  it('does not call next() when the wrapped function resolves normally', async () => {
    const successHandler = async (req, res) => res.end();
    const res = { end: jest.fn() };
    const next = jest.fn();
    const wrapped = asyncHandler(successHandler);

    await wrapped({}, res, next);

    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
