import * as Sentry from "@sentry/node";

export const protect = (req, res, next) => {
    try {
        const { userId } = req.auth();

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        next();
    } catch (err) {
        Sentry.captureException(err);
        res.status(401).json({ message: err.message });
    }
};
