const attendeeService = require("../services/attendeeService");
const bulkImportService = require("../services/bulkImportService");
const { sendResponse } = require("../utils/responseHandler");

async function registerAttendee(req, res, next) {
    try {
        const attendee = await attendeeService.createAttendee(req.user.id, req.eventId, req.body);
        return sendResponse(res, 201, "Attendee registered successfully", attendee);
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

async function getAttendeeStats(req, res, next) {
    try {
        const stats = await attendeeService.getAttendeeStats(req.eventId);
        return sendResponse(res, 200, "Attendee stats retrieved successfully", stats);
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

async function updateAttendee(req, res, next) {
    try {
        const updated = await attendeeService.updateAttendeeProfile(req.params.id, req.body);
        return sendResponse(res, 200, "Attendee updated successfully", updated);
    } catch (error) {
        next(error);
    }
}

async function deleteAttendee(req, res, next) {
    try {
        const result = await attendeeService.deleteAttendee(req.params.id);
        return sendResponse(res, 200, "Attendee deleted successfully", result);
    } catch (error) {
        next(error);
    }
}

async function bulkDeleteAttendees(req, res, next) {
    try {
        const result = await attendeeService.bulkDeleteAttendees(req.body.attendeeIds, req.eventId);
        return sendResponse(res, 200, "Selected attendees deleted successfully", result);
    } catch (error) {
        next(error);
    }
}

async function approveAttendee(req, res, next) {
    try {
        const result = await attendeeService.approveAttendee(req.params.id, req.eventId);
        return sendResponse(res, 200, "Attendee approved successfully", result);
    } catch (error) {
        next(error);
    }
}

async function bulkApproveAttendees(req, res, next) {
    try {
        const result = await attendeeService.bulkApproveAttendees(req.body.attendeeIds, req.eventId);
        return sendResponse(res, 200, "Selected attendees approved successfully", result);
    } catch (error) {
        next(error);
    }
}

async function rejectAttendee(req, res, next) {
    try {
        const { reason } = req.body;
        const result = await attendeeService.rejectAttendee(req.params.id, reason, req.eventId);
        return sendResponse(res, 200, "Attendee rejected successfully", result);
    } catch (error) {
        next(error);
    }
}

async function bulkRejectAttendees(req, res, next) {
    try {
        const { attendeeIds, reason } = req.body;
        const result = await attendeeService.bulkRejectAttendees(attendeeIds, reason, req.eventId);
        return sendResponse(res, 200, "Selected attendees rejected successfully", result);
    } catch (error) {
        next(error);
    }
}

async function checkInAttendee(req, res, next) {
    try {
        const { gate_location, method } = req.body;
        const result = await attendeeService.checkInAttendee(req.params.id, gate_location, method, req.user?.id);
        return sendResponse(res, 200, "Attendee checked in successfully", result);
    } catch (error) {
        next(error);
    }
}

async function checkOutAttendee(req, res, next) {
    try {
        const result = await attendeeService.checkOutAttendee(req.params.id);
        return sendResponse(res, 200, "Attendee checked out successfully", result);
    } catch (error) {
        next(error);
    }
}

async function qrCheckIn(req, res, next) {
    try {
        const { qr_token_hash, gate_location } = req.body;
        const result = await attendeeService.qrCheckIn(req.eventId, qr_token_hash, gate_location, req.user?.id);
        return sendResponse(res, 200, "Attendee checked in via QR successfully", result);
    } catch (error) {
        next(error);
    }
}

async function printBadge(req, res, next) {
    try {
        const { badge_template } = req.body;
        const result = await attendeeService.printBadge(req.params.id, badge_template);
        return sendResponse(res, 200, "Badge generated successfully", result);
    } catch (error) {
        next(error);
    }
}

async function bulkPrintBadges(req, res, next) {
    try {
        const { attendeeIds, badge_template } = req.body;
        const result = await attendeeService.bulkPrintBadges(attendeeIds, badge_template, req.eventId);
        return sendResponse(res, 200, "Badges generated successfully", result);
    } catch (error) {
        next(error);
    }
}

async function regenerateQr(req, res, next) {
    try {
        const result = await attendeeService.regenerateQr(req.params.id);
        return sendResponse(res, 200, "QR code regenerated successfully", result);
    } catch (error) {
        next(error);
    }
}

async function sendEmail(req, res, next) {
    try {
        const { subject, message, type } = req.body;
        const result = await attendeeService.sendEmailToAttendee(req.params.id, subject, message, type);
        return sendResponse(res, 200, "Email sent successfully", result);
    } catch (error) {
        next(error);
    }
}

async function bulkSendEmail(req, res, next) {
    try {
        const { attendeeIds, subject, message } = req.body;
        const result = await attendeeService.bulkSendEmail(attendeeIds, subject, message, req.eventId);
        return sendResponse(res, 200, "Emails dispatched successfully", result);
    } catch (error) {
        next(error);
    }
}

async function resetPassword(req, res, next) {
    try {
        const result = await attendeeService.resetPasswordToken(req.params.id);
        return sendResponse(res, 200, "Password setup link sent successfully", result);
    } catch (error) {
        next(error);
    }
}

async function resendSetupLink(req, res, next) {
    try {
        const result = await attendeeService.resendSetupLink(req.params.id, req.eventId);
        return sendResponse(res, 200, result.message, result);
    } catch (error) {
        next(error);
    }
}

async function updatePrivacySettings(req, res, next) {
    try {
        const { settings } = req.body;
        const targetId = req.params.id || req.user.id;
        const updatedSettings = await attendeeService.updatePrivacySettings(targetId, settings);
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

async function getBulkImportTemplate(req, res, next) {
    try {
        const csv = bulkImportService.getSampleCsvTemplate();
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="attendees_import_template.csv"');
        return res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
}

async function bulkImportAttendees(req, res, next) {
    try {
        const csvContent = req.body.csv_content || req.body.file || req.body.csv;
        const result = await bulkImportService.bulkImportAttendees(req.eventId, req.user?.id, csvContent);
        return sendResponse(res, 201, "Bulk import completed successfully", result);
    } catch (error) {
        next(error);
    }
}

async function listImportJobs(req, res, next) {
    try {
        const jobs = await bulkImportService.listImportJobs(req.eventId);
        return sendResponse(res, 200, "Import jobs retrieved successfully", jobs);
    } catch (error) {
        next(error);
    }
}

async function getImportJobDetails(req, res, next) {
    try {
        const job = await bulkImportService.getImportJobDetails(req.eventId, req.params.jobId);
        return sendResponse(res, 200, "Import job details retrieved successfully", job);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    registerAttendee,
    listAttendeesAdmin,
    getAttendeeStats,
    getAttendeeProfile,
    updateAttendee,
    deleteAttendee,
    bulkDeleteAttendees,
    approveAttendee,
    bulkApproveAttendees,
    rejectAttendee,
    bulkRejectAttendees,
    checkInAttendee,
    checkOutAttendee,
    qrCheckIn,
    printBadge,
    bulkPrintBadges,
    regenerateQr,
    sendEmail,
    bulkSendEmail,
    resetPassword,
    resendSetupLink,
    updatePrivacySettings,
    toggleStatus,
    listAttendeeDirectory,
    updateProfile: updateAttendee,
    getBulkImportTemplate,
    bulkImportAttendees,
    listImportJobs,
    getImportJobDetails,
};
