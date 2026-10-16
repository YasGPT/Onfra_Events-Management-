const networkingService = require("../services/networkingService");
const { sendResponse } = require("../utils/responseHandler");

// QR & Connections
async function getMyQr(req, res, next) {
    try {
        const qr = await networkingService.getMyQrCode(req.user.id);
        return sendResponse(res, 200, "QR Code retrieved successfully", qr);
    } catch (error) {
        next(error);
    }
}

async function previewScan(req, res, next) {
    try {
        const { qr_token } = req.body;
        const preview = await networkingService.previewQrScan(req.user.id, req.eventId, qr_token);
        return sendResponse(res, 200, "Scanned attendee preview retrieved", preview);
    } catch (error) {
        next(error);
    }
}

async function connectQr(req, res, next) {
    try {
        const result = await networkingService.connectViaQr(req.user.id, req.eventId, req.body);
        return sendResponse(res, 201, result.message, {
            connection: result.connection,
            conversation: result.conversation,
        });
    } catch (error) {
        next(error);
    }
}

async function listConnections(req, res, next) {
    try {
        const connections = await networkingService.getMyConnections(req.user.id, req.eventId);
        return sendResponse(res, 200, "Connections retrieved successfully", connections);
    } catch (error) {
        next(error);
    }
}

// 1-on-1 Meetings
async function requestMeeting(req, res, next) {
    try {
        const meeting = await networkingService.requestMeeting(req.user.id, req.eventId, req.body);
        return sendResponse(res, 201, "Meeting requested successfully", meeting);
    } catch (error) {
        next(error);
    }
}

async function listMeetings(req, res, next) {
    try {
        const meetings = await networkingService.getMyMeetings(req.user.id, req.eventId, req.query.status);
        return sendResponse(res, 200, "Meetings retrieved successfully", meetings);
    } catch (error) {
        next(error);
    }
}

async function respondMeeting(req, res, next) {
    try {
        const { status } = req.body;
        const meeting = await networkingService.respondToMeeting(req.params.id, req.user.id, status);
        return sendResponse(res, 200, `Meeting request ${status}`, meeting);
    } catch (error) {
        next(error);
    }
}

async function cancelMeeting(req, res, next) {
    try {
        const result = await networkingService.cancelMeeting(req.params.id, req.user.id);
        return sendResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
}

// Chat / Messaging
async function listConversations(req, res, next) {
    try {
        const conversations = await networkingService.getConversations(req.user.id, req.eventId);
        return sendResponse(res, 200, "Conversations retrieved successfully", conversations);
    } catch (error) {
        next(error);
    }
}

async function listMessages(req, res, next) {
    try {
        const messages = await networkingService.getMessages(req.params.id, req.user.id);
        return sendResponse(res, 200, "Messages retrieved successfully", messages);
    } catch (error) {
        next(error);
    }
}

async function sendMessage(req, res, next) {
    try {
        const { message_text } = req.body;
        const message = await networkingService.sendMessage(req.params.id, req.user.id, message_text);
        return sendResponse(res, 201, "Message sent successfully", message);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyQr,
    previewScan,
    connectQr,
    listConnections,
    requestMeeting,
    listMeetings,
    respondMeeting,
    cancelMeeting,
    listConversations,
    listMessages,
    sendMessage,
};
