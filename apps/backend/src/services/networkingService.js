const {
    Attendee,
    AttendeePrivacySetting,
    Connection,
    ConnectionSharedField,
    Conversation,
    Message,
    Meeting,
    MeetingRescheduleRequest,
    Venue,
    Event,
} = require("../models");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");

// --- QR Codes & Connections ---
async function getMyQrCode(attendeeId) {
    const attendee = await Attendee.findByPk(attendeeId, {
        attributes: ["id", "full_name", "company_name", "job_title", "qr_token_hash"],
    });
    if (!attendee) throw new AppError("Attendee not found.", 404);

    return {
        attendee_id: attendee.id,
        full_name: attendee.full_name,
        company_name: attendee.company_name,
        job_title: attendee.job_title,
        qr_token: attendee.qr_token_hash,
    };
}

async function previewQrScan(currentAttendeeId, eventId, qr_token) {
    if (!qr_token) throw new AppError("QR token is required.", 400);

    const targetAttendee = await Attendee.findOne({
        where: { event_id: eventId, qr_token_hash: qr_token, is_active: true },
        include: [{ model: AttendeePrivacySetting }],
    });

    if (!targetAttendee) {
        throw new AppError("Invalid QR code or attendee is not in this event.", 404);
    }

    if (targetAttendee.id === currentAttendeeId) {
        throw new AppError("You cannot scan your own QR code.", 400);
    }

    const settings = targetAttendee.AttendeePrivacySettings || [];
    const shareableFields = {};

    settings.forEach((s) => {
        if (s.allow_qr_share) {
            shareableFields[s.field_name] = targetAttendee[s.field_name];
        }
    });

    return {
        target_attendee_id: targetAttendee.id,
        full_name: targetAttendee.full_name,
        company_name: targetAttendee.company_name,
        job_title: targetAttendee.job_title,
        shareable_fields: shareableFields,
    };
}

async function connectViaQr(currentAttendeeId, eventId, data) {
    const { target_attendee_id, shared_fields = [] } = data;

    if (!target_attendee_id) {
        throw new AppError("Target attendee ID is required.", 400);
    }

    // Check existing connection
    let connection = await Connection.findOne({
        where: {
            event_id: eventId,
            [Op.or]: [
                { attendee_a_id: currentAttendeeId, attendee_b_id: target_attendee_id },
                { attendee_a_id: target_attendee_id, attendee_b_id: currentAttendeeId },
            ],
        },
    });

    if (connection) {
        if (connection.status === "accepted") {
            return { connection, message: "You are already connected." };
        }
        await connection.update({ status: "accepted", responded_at: new Date() });
    } else {
        // Create accepted connection (instant mutual QR connect)
        connection = await Connection.create({
            event_id: eventId,
            attendee_a_id: currentAttendeeId,
            attendee_b_id: target_attendee_id,
            requested_by_attendee_id: currentAttendeeId,
            status: "accepted",
            requested_at: new Date(),
            responded_at: new Date(),
        });
    }

    // Save consented fields
    for (const field of shared_fields) {
        await ConnectionSharedField.upsert({
            connection_id: connection.id,
            owner_attendee_id: currentAttendeeId,
            field_name: field,
            is_shared: true,
            consented_at: new Date(),
        });
    }

    // Auto-create 1-on-1 Conversation
    const [conversation] = await Conversation.findOrCreate({
        where: { connection_id: connection.id },
        defaults: { event_id: eventId, connection_id: connection.id },
    });

    return { connection, conversation, message: "Connected successfully via QR!" };
}

async function getMyConnections(currentAttendeeId, eventId) {
    const connections = await Connection.findAll({
        where: {
            event_id: eventId,
            status: "accepted",
            [Op.or]: [
                { attendee_a_id: currentAttendeeId },
                { attendee_b_id: currentAttendeeId },
            ],
        },
        include: [
            { model: Conversation, attributes: ["id", "last_message_at"] },
            { model: ConnectionSharedField },
        ],
    });

    const partnerIds = connections.map((c) =>
        c.attendee_a_id === currentAttendeeId ? c.attendee_b_id : c.attendee_a_id
    );

    const partners = await Attendee.findAll({
        where: { id: partnerIds },
        attributes: [
            "id",
            "full_name",
            "email",
            "phone",
            "company_name",
            "job_title",
            "bio",
            "website_url",
            "whatsapp_url",
        ],
    });

    const partnerMap = new Map(partners.map((p) => [p.id, p]));

    return connections.map((c) => {
        const partnerId = c.attendee_a_id === currentAttendeeId ? c.attendee_b_id : c.attendee_a_id;
        const partner = partnerMap.get(partnerId)?.toJSON() || {};

        return {
            connection_id: c.id,
            connected_at: c.responded_at || c.requested_at,
            conversation_id: c.Conversation?.id || null,
            last_message_at: c.Conversation?.last_message_at || null,
            partner,
        };
    });
}

// --- 1-on-1 Meetings ---
async function requestMeeting(requesterId, eventId, data) {
    const {
        recipient_attendee_id,
        starts_at,
        ends_at,
        venue_id,
        location_details,
        purpose,
    } = data;

    if (!recipient_attendee_id || !starts_at || !ends_at) {
        throw new AppError("Recipient attendee ID, start time, and end time are required.", 400);
    }

    if (recipient_attendee_id === requesterId) {
        throw new AppError("You cannot schedule a meeting with yourself.", 400);
    }

    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);

    if (endDate <= startDate) {
        throw new AppError("End time must be after start time.", 400);
    }

    // Schedule overlap conflict check for requester
    const requesterConflict = await Meeting.findOne({
        where: {
            event_id: eventId,
            status: "accepted",
            [Op.or]: [
                { requester_attendee_id: requesterId },
                { recipient_attendee_id: requesterId },
            ],
            starts_at: { [Op.lt]: endDate },
            ends_at: { [Op.gt]: startDate },
        },
    });

    if (requesterConflict) {
        throw new AppError("You already have another confirmed meeting during this time slot.", 409);
    }

    // Schedule overlap conflict check for recipient
    const recipientConflict = await Meeting.findOne({
        where: {
            event_id: eventId,
            status: "accepted",
            [Op.or]: [
                { requester_attendee_id: recipient_attendee_id },
                { recipient_attendee_id: recipient_attendee_id },
            ],
            starts_at: { [Op.lt]: endDate },
            ends_at: { [Op.gt]: startDate },
        },
    });

    if (recipientConflict) {
        throw new AppError("The recipient is already booked for another meeting during this time.", 409);
    }

    // Calculate expiry (from event settings or default 24h)
    const event = await Event.findByPk(eventId);
    const expiryHours = event?.meeting_request_expiry_hours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    const meeting = await Meeting.create({
        event_id: eventId,
        requester_attendee_id: requesterId,
        recipient_attendee_id,
        starts_at: startDate,
        ends_at: endDate,
        venue_id: venue_id || null,
        location_details,
        purpose,
        status: "pending",
        expires_at: expiresAt,
    });

    return meeting;
}

async function getMyMeetings(attendeeId, eventId, status) {
    const where = {
        event_id: eventId,
        [Op.or]: [
            { requester_attendee_id: attendeeId },
            { recipient_attendee_id: attendeeId },
        ],
    };

    if (status) {
        where.status = status;
    }

    return Meeting.findAll({
        where,
        include: [
            { model: Venue, attributes: ["id", "name", "location_details"] },
            { model: MeetingRescheduleRequest },
        ],
        order: [["starts_at", "ASC"]],
    });
}

async function respondToMeeting(meetingId, currentAttendeeId, status) {
    if (!["accepted", "rejected"].includes(status)) {
        throw new AppError("Status must be 'accepted' or 'rejected'.", 400);
    }

    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) throw new AppError("Meeting not found.", 404);

    if (meeting.recipient_attendee_id !== currentAttendeeId) {
        throw new AppError("Only the invited recipient can respond to this meeting request.", 403);
    }

    if (meeting.status !== "pending") {
        throw new AppError(`Cannot respond to meeting with status '${meeting.status}'.`, 400);
    }

    await meeting.update({
        status,
        responded_at: new Date(),
    });

    return meeting;
}

async function cancelMeeting(meetingId, currentAttendeeId) {
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) throw new AppError("Meeting not found.", 404);

    if (
        meeting.requester_attendee_id !== currentAttendeeId &&
        meeting.recipient_attendee_id !== currentAttendeeId
    ) {
        throw new AppError("You are not a participant in this meeting.", 403);
    }

    await meeting.update({
        status: "cancelled",
        cancelled_by_attendee_id: currentAttendeeId,
    });

    return { success: true, message: "Meeting cancelled successfully." };
}

// --- 1-on-1 Chat / Messaging ---
async function getConversations(attendeeId, eventId) {
    const connections = await Connection.findAll({
        where: {
            event_id: eventId,
            status: "accepted",
            [Op.or]: [
                { attendee_a_id: attendeeId },
                { attendee_b_id: attendeeId },
            ],
        },
        include: [{ model: Conversation }],
    });

    const conversations = [];

    for (const c of connections) {
        if (c.Conversation) {
            const partnerId = c.attendee_a_id === attendeeId ? c.attendee_b_id : c.attendee_a_id;
            const partner = await Attendee.findByPk(partnerId, {
                attributes: ["id", "full_name", "company_name", "job_title"],
            });

            conversations.push({
                conversation_id: c.Conversation.id,
                connection_id: c.id,
                partner,
                last_message_at: c.Conversation.last_message_at,
            });
        }
    }

    return conversations.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
}

async function getMessages(conversationId, attendeeId) {
    const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: Connection }],
    });

    if (!conversation) throw new AppError("Conversation not found.", 404);

    const c = conversation.Connection;
    if (c.attendee_a_id !== attendeeId && c.attendee_b_id !== attendeeId) {
        throw new AppError("Access denied to this conversation.", 403);
    }

    return Message.findAll({
        where: { conversation_id: conversationId },
        order: [["sent_at", "ASC"]],
    });
}

async function sendMessage(conversationId, senderId, message_text) {
    if (!message_text || !message_text.trim()) {
        throw new AppError("Message text cannot be empty.", 400);
    }

    const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: Connection }],
    });

    if (!conversation) throw new AppError("Conversation not found.", 404);

    const c = conversation.Connection;
    if (c.attendee_a_id !== senderId && c.attendee_b_id !== senderId) {
        throw new AppError("Access denied to this conversation.", 403);
    }

    const message = await Message.create({
        conversation_id: conversationId,
        sender_attendee_id: senderId,
        message_text: message_text.trim(),
        sent_at: new Date(),
    });

    await conversation.update({ last_message_at: new Date() });

    return message;
}

module.exports = {
    getMyQrCode,
    previewQrScan,
    connectViaQr,
    getMyConnections,
    requestMeeting,
    getMyMeetings,
    respondToMeeting,
    cancelMeeting,
    getConversations,
    getMessages,
    sendMessage,
};
