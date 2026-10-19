const { Attendee, AttendeeImportJob, AttendeeImportRow, sequelize } = require("../models");
const AppError = require("../utils/AppError");

function parseCsv(content) {
    if (!content || typeof content !== "string") {
        return [];
    }

    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        return [];
    }

    // Parse header
    const headers = parseCsvLine(lines[0]).map((h) =>
        h.toLowerCase().replace(/[^a-z0-9_]/g, "_").trim()
    );

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length === 0) continue;

        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] !== undefined ? values[idx].trim() : "";
        });
        rows.push(row);
    }
    return rows;
}

function parseCsvLine(line) {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === "," && !insideQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function getSampleCsvTemplate() {
    return (
        "full_name,email,phone,company_name,job_title,badge_template\n" +
        "John Doe,john.doe@example.com,+1234567890,Acme Global,Chief Technology Officer,standard\n" +
        "Jane Smith,jane.smith@example.com,+1987654321,Tech Innovations,Product Lead,vip\n" +
        "Alex Rivera,alex.rivera@example.com,+14155550199,NextGen Labs,Principal Engineer,speaker\n"
    );
}

async function bulkImportAttendees(eventId, adminId, csvContent) {
    if (!csvContent || typeof csvContent !== "string") {
        throw new AppError("CSV content is required for bulk import.", 400);
    }

    const rows = parseCsv(csvContent);
    if (rows.length === 0) {
        throw new AppError("CSV file is empty or contains only headers.", 400);
    }

    // 1. Create Job record
    const job = await AttendeeImportJob.create({
        event_id: eventId,
        uploaded_by_admin_id: adminId || null,
        status: "processing",
        total_rows: rows.length,
        processed_rows: 0,
        successful_rows: 0,
        failed_rows: 0,
        started_at: new Date(),
    });

    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const recordedRows = [];

    // Process each row
    for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx];
        const rowNumber = idx + 1;

        // Header mapping flexibility
        const fullName = row.full_name || row.name || row.attendee_name || "";
        const email = (row.email || row.email_address || "").toLowerCase().trim();
        const phone = row.phone || row.mobile || row.mobile_number || null;
        const company = row.company_name || row.company || row.organization || null;
        const jobTitle = row.job_title || row.designation || row.title || null;
        const badgeTemplate = row.badge_template || "standard";

        // Validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            failedCount++;
            const importRow = await AttendeeImportRow.create({
                import_job_id: job.id,
                row_number: rowNumber,
                raw_data: row,
                normalized_email: email || null,
                validation_errors: { email: "A valid email address is required" },
                status: "failed",
            });
            recordedRows.push(importRow);
            continue;
        }

        if (!fullName) {
            failedCount++;
            const importRow = await AttendeeImportRow.create({
                import_job_id: job.id,
                row_number: rowNumber,
                raw_data: row,
                normalized_email: email,
                validation_errors: { full_name: "Full name is required" },
                status: "failed",
            });
            recordedRows.push(importRow);
            continue;
        }

        // Check duplicate
        const existing = await Attendee.findOne({
            where: { event_id: eventId, email },
        });

        if (existing) {
            duplicateCount++;
            const importRow = await AttendeeImportRow.create({
                import_job_id: job.id,
                row_number: rowNumber,
                raw_data: row,
                normalized_email: email,
                attendee_id: existing.id,
                validation_errors: { email: "Email already registered for this event" },
                status: "duplicate",
            });
            recordedRows.push(importRow);
            continue;
        }

        try {
            // Create attendee
            const attendee = await Attendee.create({
                event_id: eventId,
                full_name: fullName,
                email,
                phone,
                company_name: company,
                job_title: jobTitle,
                badge_template: badgeTemplate,
                registration_status: "registered",
                is_active: true,
                registered_at: new Date(),
                approved_at: new Date(),
            });

            importedCount++;

            const importRow = await AttendeeImportRow.create({
                import_job_id: job.id,
                row_number: rowNumber,
                raw_data: row,
                normalized_email: email,
                attendee_id: attendee.id,
                status: "imported",
            });
            recordedRows.push(importRow);
        } catch (err) {
            failedCount++;
            const importRow = await AttendeeImportRow.create({
                import_job_id: job.id,
                row_number: rowNumber,
                raw_data: row,
                normalized_email: email,
                validation_errors: { server: err.message },
                status: "failed",
            });
            recordedRows.push(importRow);
        }
    }

    // 2. Finalize Job
    job.processed_rows = rows.length;
    job.successful_rows = importedCount;
    job.failed_rows = failedCount + duplicateCount;
    job.status = "completed";
    job.completed_at = new Date();
    await job.save();

    return {
        job,
        summary: {
            total: rows.length,
            imported: importedCount,
            duplicates: duplicateCount,
            failed: failedCount,
        },
        rows: recordedRows,
    };
}

async function listImportJobs(eventId) {
    return AttendeeImportJob.findAll({
        where: { event_id: eventId },
        order: [["created_at", "DESC"]],
    });
}

async function getImportJobDetails(eventId, jobId) {
    const job = await AttendeeImportJob.findOne({
        where: { id: jobId, event_id: eventId },
        include: [{ model: AttendeeImportRow }],
    });
    if (!job) {
        throw new AppError("Import job not found.", 404);
    }
    return job;
}

module.exports = {
    getSampleCsvTemplate,
    bulkImportAttendees,
    listImportJobs,
    getImportJobDetails,
};
