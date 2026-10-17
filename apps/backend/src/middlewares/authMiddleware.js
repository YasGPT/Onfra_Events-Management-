const { verifyAccessToken } = require("../utils/tokenUtils");
const AppError = require("../utils/AppError");

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(
                new AppError("Authentication required. Please provide a valid Bearer token.", 401)
            );
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return next(new AppError("Authentication token is missing.", 401));
        }

        const decoded = verifyAccessToken(token);

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { authenticate };
