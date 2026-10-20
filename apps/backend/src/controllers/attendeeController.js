const attendeeService = require("../services/attendeeService");
const { sendResponse } = require("../utils/responseHandler");

/**
 * Public Attendee Self-Registration via Event QR Code / Web Form
 */
async function publicRegister(req, res, next) {
    try {
        const eventId = req.params.eventId;
        const result = await attendeeService.publicRegisterAttendee(eventId, req.body);
        return sendResponse(res, 201, result.message, result);
    } catch (error) {
        next(error);
    }
}

/**
 * Admin registers attendee directly (already active)
 */
async function registerAttendee(req, res, next) {
    try {
        const attendee = await attendeeService.createAttendee(req.user.id, req.eventId, req.body);
        return sendResponse(res, 201, "Attendee registered successfully", attendee);
    } catch (error) {
        next(error);
    }
}

/**
 * Admin approves a pending attendee registration
 */
async function approveAttendee(req, res, next) {
    try {
        const result = await attendeeService.approveAttendee(req.eventId, req.params.id);
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

/**
 * Admin rejects a pending attendee registration
 */
async function rejectAttendee(req, res, next) {
    try {
        const { reason } = req.body || {};
        const result = await attendeeService.rejectAttendee(req.eventId, req.params.id, reason);
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

/**
 * Admin / Helpdesk resets an attendee password directly
 */
async function adminResetPassword(req, res, next) {
    try {
        const { new_password } = req.body || {};
        const result = await attendeeService.adminResetPassword(req.eventId, req.params.id, new_password);
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

async function listAttendeesAdmin(req, res, next) {
    try {
        const attendees = await attendeeService.getAttendeesAdmin(req.eventId, req.query);
        return sendResponse(res, 200, "Attendees retrieved successfully", attendees);
    } catch (error) {
        next(error);
    }
}

async function listAttendeeDirectory(req, res, next) {
    try {
        const directory = await attendeeService.getAttendeeDirectory(
            req.eventId,
            req.user.id,
            req.query
        );
        return sendResponse(res, 200, "Attendee directory retrieved successfully", directory);
    } catch (error) {
        next(error);
    }
}

async function getAttendeeProfile(req, res, next) {
    try {
        const targetId = req.params.id || req.user.id;
        const profile = await attendeeService.getAttendeeById(targetId);
        return sendResponse(res, 200, "Attendee profile retrieved successfully", profile);
    } catch (error) {
        next(error);
    }
}

async function updateProfile(req, res, next) {
    try {
        const updated = await attendeeService.updateAttendeeProfile(req.user.id, req.body);
        return sendResponse(res, 200, "Profile updated successfully", updated);
    } catch (error) {
        next(error);
    }
}

async function updatePrivacySettings(req, res, next) {
    try {
        const { settings } = req.body;
        const updatedSettings = await attendeeService.updatePrivacySettings(req.user.id, settings);
        return sendResponse(res, 200, "Privacy settings updated successfully", updatedSettings);
    } catch (error) {
        next(error);
    }
}

async function toggleStatus(req, res, next) {
    try {
        const { is_active } = req.body;
        const result = await attendeeService.toggleAttendeeStatus(req.params.id, is_active);
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

const bulkImportService = require("../services/bulkImportService");

/**
 * Admin Bulk Imports Attendees via CSV upload, raw CSV text, or JSON array
 */
async function bulkImportAttendees(req, res, next) {
    try {
        const buffer = req.file ? req.file.buffer : null;
        const rawCsv = req.body ? req.body.csv_content : null;
        const rows = req.body
            ? Array.isArray(req.body.attendees)
                ? req.body.attendees
                : Array.isArray(req.body)
                ? req.body
                : null
            : null;
        const originalFilename = req.file ? req.file.originalname : null;

        const result = await bulkImportService.importAttendees(req.user.id, req.eventId, {
            buffer,
            rawCsv,
            rows,
            originalFilename,
        });

        const statusMsg = `Bulk import ${result.job.status}: ${result.summary.imported} imported, ${result.summary.duplicates} duplicates, ${result.summary.failed} failed.`;
        return sendResponse(res, 201, statusMsg, result);
    } catch (error) {
        next(error);
    }
}

/**
 * Admin Lists Bulk Import Jobs for an event
 */
async function listImportJobs(req, res, next) {
    try {
        const jobs = await bulkImportService.listImportJobs(req.eventId, req.query);
        return sendResponse(res, 200, "Import jobs retrieved successfully", jobs);
    } catch (error) {
        next(error);
    }
}

/**
 * Admin Gets Details of a Specific Bulk Import Job with row breakdowns
 */
async function getImportJobDetails(req, res, next) {
    try {
        const job = await bulkImportService.getImportJobDetails(req.eventId, req.params.jobId);
        return sendResponse(res, 200, "Import job details retrieved successfully", job);
    } catch (error) {
        next(error);
    }
}

/**
 * Download sample CSV template for bulk importing attendees
 */
async function getImportTemplate(req, res, next) {
    try {
        const csvContent = bulkImportService.getSampleCsvTemplate();
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="confra_attendees_template.csv"');
        return res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    publicRegister,
    registerAttendee,
    approveAttendee,
    rejectAttendee,
    adminResetPassword,
    listAttendeesAdmin,
    listAttendeeDirectory,
    getAttendeeProfile,
    updateProfile,
    updatePrivacySettings,
    toggleStatus,
    bulkImportAttendees,
    listImportJobs,
    getImportJobDetails,
    getImportTemplate,
};
