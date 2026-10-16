const AppError = require("../utils/AppError");

function errorHandler(err, req, res, next) {
    let error = err;

    // Handle Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
        const message = err.errors.map((e) => e.message).join(", ");
        error = new AppError(`Validation error: ${message}`, 400);
    }

    // Handle Sequelize unique constraint errors
    if (err.name === "SequelizeUniqueConstraintError") {
        const field = err.errors[0]?.path || "field";
        error = new AppError(`A record with this ${field} already exists.`, 409);
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
        error = new AppError("Invalid authentication token.", 401);
    }
    if (err.name === "TokenExpiredError") {
        error = new AppError("Authentication token has expired. Please log in again.", 401);
    }

    const statusCode = error.statusCode || 500;
    const status = error.status || "error";
    const message = error.message || "Internal server error occurred.";

    if (process.env.NODE_ENV === "development" && statusCode === 500) {
        console.error("UNHANDLED ERROR:", err);
    }

    return res.status(statusCode).json({
        success: false,
        status,
        message,
        ...(error.details ? { details: error.details } : {}),
        ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    });
}

module.exports = errorHandler;
