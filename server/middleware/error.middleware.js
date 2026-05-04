/**
 * @param {Error & { status?: number }} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        next(err);
        return;
    }
    console.error(err);
    const status = err.status ?? 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ ok: false, error: message });
}
