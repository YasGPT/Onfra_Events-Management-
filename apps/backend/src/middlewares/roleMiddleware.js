const AppError = require("../utils/AppError");

function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError("User is not authenticated.", 401));
        }

        // Super Admin always has full access
        if (req.user.role === "Super Admin") {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access forbidden. Requires one of the following roles: [${allowedRoles.join(
                        ", "
                    )}].`,
                    403
                )
            );
        }

        next();
    };
}

function requireUserType(...allowedTypes) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError("User is not authenticated.", 401));
        }

        if (!allowedTypes.includes(req.user.userType)) {
            return next(
                new AppError(
                    `Access forbidden. This endpoint is restricted to: [${allowedTypes.join(", ")}].`,
                    403
                )
            );
        }

        next();
    };
}

module.exports = {
    requireRoles,
    requireUserType,
};
