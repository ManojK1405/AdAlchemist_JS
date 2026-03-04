import * as Sentry from "@sentry/node";

export const protect = (req, res, next) => {
    try {
        const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
        const userId = auth?.userId;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        next();
    } catch (err) {
        Sentry.captureException(err);
        res.status(401).json({ message: err.message });
    }
};
