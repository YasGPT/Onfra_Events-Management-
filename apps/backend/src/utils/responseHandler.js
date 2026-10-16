/**
 * Standard API response helper
 */
function sendResponse(res, statusCode, message, data = null) {
    const payload = {
        success: statusCode >= 200 && statusCode < 300,
        message,
    };

    if (data !== null && data !== undefined) {
        payload.data = data;
    }

    return res.status(statusCode).json(payload);
}

module.exports = { sendResponse };
