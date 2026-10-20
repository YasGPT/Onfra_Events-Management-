const multer = require("multer");
const AppError = require("../utils/AppError");

// Use memory storage to process CSV directly from buffer
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = [".csv", ".txt"];
        const isCsvExt = allowedExtensions.some((ext) =>
            file.originalname.toLowerCase().endsWith(ext)
        );
        const isCsvMime = [
            "text/csv",
            "application/csv",
            "text/plain",
            "application/vnd.ms-excel",
            "application/octet-stream",
            "text/comma-separated-values",
        ].includes(file.mimetype);

        if (isCsvExt || isCsvMime) {
            cb(null, true);
        } else {
            cb(new AppError("Only CSV files are allowed for attendee bulk import.", 400), false);
        }
    },
});

/**
 * Flexible middleware: handles multipart/form-data with file field 'file',
 * but also gracefully passes through if the client sends application/json with raw CSV or attendee array.
 */
function uploadCsvHandler(req, res, next) {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
        upload.single("file")(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return next(new AppError("File is too large. Maximum size allowed is 10 MB.", 400));
                }
                return next(new AppError(`Upload error: ${err.message}`, 400));
            } else if (err) {
                return next(err);
            }
            next();
        });
    } else {
        // Not a multipart request (e.g. JSON with raw csv_content or attendees array)
        next();
    }
}

module.exports = {
    uploadCsvHandler,
};
