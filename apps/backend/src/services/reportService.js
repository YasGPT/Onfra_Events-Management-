const {
    Attendee,
    Exhibitor,
    Sponsor,
    Session,
    Meeting,
    Connection,
} = require("../models");

async function getEventOverview(eventId) {
    const totalAttendees = await Attendee.count({ where: { event_id: eventId } });
    const totalExhibitors = await Exhibitor.count({ where: { event_id: eventId, status: "active" } });
    const totalSponsors = await Sponsor.count({ where: { event_id: eventId, status: "active" } });
    const totalSessions = await Session.count({ where: { event_id: eventId } });
    const totalConnections = await Connection.count({ where: { event_id: eventId, status: "accepted" } });

    // Meetings by status
    const totalMeetings = await Meeting.count({ where: { event_id: eventId } });
    const acceptedMeetings = await Meeting.count({ where: { event_id: eventId, status: "accepted" } });
    const pendingMeetings = await Meeting.count({ where: { event_id: eventId, status: "pending" } });
    const rejectedMeetings = await Meeting.count({ where: { event_id: eventId, status: "rejected" } });
    const expiredMeetings = await Meeting.count({ where: { event_id: eventId, status: "expired" } });
    const cancelledMeetings = await Meeting.count({ where: { event_id: eventId, status: "cancelled" } });

    return {
        attendees: {
            total: totalAttendees,
        },
        exhibitors: {
            total: totalExhibitors,
        },
        sponsors: {
            total: totalSponsors,
        },
        agenda: {
            total_sessions: totalSessions,
        },
        connections: {
            total_accepted: totalConnections,
        },
        meetings: {
            total: totalMeetings,
            accepted: acceptedMeetings,
            pending: pendingMeetings,
            rejected: rejectedMeetings,
            expired: expiredMeetings,
            cancelled: cancelledMeetings,
        },
    };
}

async function exportAttendeesCsv(eventId) {
    const attendees = await Attendee.findAll({
        where: { event_id: eventId },
        attributes: [
            "full_name",
            "email",
            "phone",
            "company_name",
            "job_title",
            "registration_status",
            "registered_at",
        ],
        order: [["registered_at", "ASC"]],
    });

    const headers = "Full Name,Email,Phone,Company,Job Title,Status,Registered At\n";
    const rows = attendees
        .map((a) =>
            [
                `"${a.full_name || ""}"`,
                `"${a.email || ""}"`,
                `"${a.phone || ""}"`,
                `"${a.company_name || ""}"`,
                `"${a.job_title || ""}"`,
                `"${a.registration_status || ""}"`,
                `"${a.registered_at ? a.registered_at.toISOString() : ""}"`,
            ].join(",")
        )
        .join("\n");

    return headers + rows;
}

module.exports = {
    getEventOverview,
    exportAttendeesCsv,
};
