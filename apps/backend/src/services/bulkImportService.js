const crypto = require("crypto");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const {
    AttendeeImportJob,
    AttendeeImportRow,
    Attendee,
    AttendeePrivacySetting,
    Event,
} = require("../models");
const AppError = require("../utils/AppError");
const { hashPassword } = require("../utils/passwordUtils");
const { Op } = require("sequelize");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_ATTENDEE_PASSWORD = "Confra@2026";
const PRIVACY_FIELDS = ["email", "phone", "company_name", "job_title", "bio"];

/**
 * Extracts normalized attendee fields from CSV row with flexible header matching.
 */
function extractRowData(row) {
    const keys = Object.keys(row);
    const getVal = (...matchers) => {
        for (const matcher of matchers) {
            const cleanMatcher = matcher.toLowerCase().replace(/[\s_-]/g, "");
            const foundKey = keys.find(
                (k) => k.trim().toLowerCase().replace(/[\s_-]/g, "") === cleanMatcher
            );
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
                const val = String(row[foundKey]).trim();
                if (val.length > 0) return val;
            }
        }
        return null;
    };

    return {
        full_name: getVal("fullname", "name", "displayname"),
        email: getVal("email", "emailaddress", "mail"),
        phone: getVal("phone", "phonenumber", "mobile", "mobilenumber", "contactnumber", "contact"),
        company_name: getVal("company", "companyname", "organization", "organizationname", "org"),
        job_title: getVal("jobtitle", "title", "designation", "role", "position"),
        bio: getVal("bio", "about", "description", "summary"),
        website_url: getVal("website", "websiteurl", "url", "web"),
        whatsapp_url: getVal("whatsapp", "whatsappurl", "whatsappnumber"),
        password: getVal("password", "pass") || DEFAULT_ATTENDEE_PASSWORD,
    };
}

/**
 * Parses a Buffer or String into an array of CSV row objects.
 */
function parseCsvStream(bufferOrString) {
    return new Promise((resolve, reject) => {
        const results = [];
        const readable = Readable.from(bufferOrString);

        readable
            .pipe(
                csvParser({
                    stripBOM: true,
                    mapHeaders: ({ header }) => header.trim(),
                    mapValues: ({ value }) => (typeof value === "string" ? value.trim() : value),
                })
            )
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (err) => reject(new AppError(`CSV parsing error: ${err.message}`, 400)));
    });
}

/**
 * Core Service: Bulk import attendees for a given event.
 */
async function importAttendees(adminId, eventId, options = {}) {
    const { buffer, rawCsv, rows: directRows, originalFilename } = options;

    // Verify event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new AppError("Event not found.", 404);
    }

    let parsedRows = [];
    if (buffer) {
        parsedRows = await parseCsvStream(buffer);
    } else if (rawCsv && typeof rawCsv === "string") {
        parsedRows = await parseCsvStream(Buffer.from(rawCsv, "utf8"));
    } else if (Array.isArray(directRows)) {
        parsedRows = directRows;
    } else {
        throw new AppError("No CSV file or data provided. Upload a .csv file or pass 'csv_content' / 'attendees'.", 400);
    }

    if (parsedRows.length === 0) {
        throw new AppError("CSV file is empty or contains only headers.", 400);
    }

    // 1. Create the AttendeeImportJob record in DB
    const job = await AttendeeImportJob.create({
        event_id: eventId,
        uploaded_by_admin_id: adminId || null,
        status: "processing",
        total_rows: parsedRows.length,
        processed_rows: 0,
        successful_rows: 0,
        failed_rows: 0,
        started_at: new Date(),
    });

    const batchEmailsSeen = new Set();
    const batchPhonesSeen = new Set();

    let successfulCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;

    const rowResults = [];

    // 2. Process each row sequentially
    for (let index = 0; index < parsedRows.length; index++) {
        const rawRow = parsedRows[index];
        const rowNumber = index + 1;
        const errors = [];
        let isDuplicate = false;

        const data = extractRowData(rawRow);
        const normalizedEmail = data.email ? data.email.toLowerCase().trim() : null;
        const normalizedPhone = data.phone ? data.phone.trim() : null;

        // Validation: Required full_name
        if (!data.full_name) {
            errors.push("Full Name is required.");
        }

        // Validation: Required and valid email format
        if (!normalizedEmail) {
            errors.push("Email is required.");
        } else if (!EMAIL_REGEX.test(normalizedEmail)) {
            errors.push(`Invalid email format: '${data.email}'.`);
        }

        // Check duplicate within the current batch
        if (normalizedEmail) {
            if (batchEmailsSeen.has(normalizedEmail)) {
                errors.push(`Duplicate email '${normalizedEmail}' found within this CSV file.`);
                isDuplicate = true;
            } else {
                batchEmailsSeen.add(normalizedEmail);
            }
        }

        if (normalizedPhone) {
            if (batchPhonesSeen.has(normalizedPhone)) {
                errors.push(`Duplicate phone '${normalizedPhone}' found within this CSV file.`);
                isDuplicate = true;
            } else {
                batchPhonesSeen.add(normalizedPhone);
            }
        }

        // Check duplicate against existing database attendees in this event
        if (!isDuplicate && normalizedEmail) {
            const existingAttendee = await Attendee.findOne({
                where: {
                    event_id: eventId,
                    email: normalizedEmail,
                },
                attributes: ["id", "email"],
            });
            if (existingAttendee) {
                errors.push(`Attendee with email '${normalizedEmail}' already exists in this event.`);
                isDuplicate = true;
            }
        }

        if (!isDuplicate && normalizedPhone) {
            const existingAttendeePhone = await Attendee.findOne({
                where: {
                    event_id: eventId,
                    phone: normalizedPhone,
                },
                attributes: ["id", "phone"],
            });
            if (existingAttendeePhone) {
                errors.push(`Attendee with phone '${normalizedPhone}' already exists in this event.`);
                isDuplicate = true;
            }
        }

        // Handle failure / duplicate
        if (errors.length > 0) {
            const status = isDuplicate ? "duplicate" : "failed";
            if (isDuplicate) duplicateCount++;
            else failedCount++;

            const importRow = await AttendeeImportRow.create({
                import_job_id: job.id,
                row_number: rowNumber,
                raw_data: rawRow,
                normalized_email: normalizedEmail,
                validation_errors: errors,
                attendee_id: null,
                status,
            });

            rowResults.push({
                row_number: rowNumber,
                full_name: data.full_name || null,
                email: normalizedEmail,
                status,
                errors,
            });
            continue;
        }

        // Create Attendee in Database
        try {
            const passwordHash = await hashPassword(data.password || DEFAULT_ATTENDEE_PASSWORD);
            const qrTokenHash = crypto.randomBytes(32).toString("hex");

            const attendee = await Attendee.create({
                event_id: eventId,
                registered_by_admin_id: adminId || null,
                full_name: data.full_name.trim(),
                email: normalizedEmail,
                phone: normalizedPhone,
                password_hash: passwordHash,
                company_name: data.company_name ? data.company_name.trim() : null,
                job_title: data.job_title ? data.job_title.trim() : null,
                bio: data.bio ? data.bio.trim() : null,
                website_url: data.website_url || null,
                whatsapp_url: data.whatsapp_url || null,
                qr_token_hash: qrTokenHash,
                registration_status: "registered",
                is_active: true,
                registered_at: new Date(),
            });

            // Seed default privacy settings for newly imported attendee
            const privacyRows = PRIVACY_FIELDS.map((field) => ({
                attendee_id: attendee.id,
                field_name: field,
                directory_visible: true,
                allow_qr_share: true,
            }));
            await AttendeePrivacySetting.bulkCreate(privacyRows);

            // Record successful import row
            await AttendeeImportRow.create({
                import_job_id: job.id,
                row_number: rowNumber,
                raw_data: rawRow,
                normalized_email: normalizedEmail,
                validation_errors: null,
                attendee_id: attendee.id,
                status: "imported",
            });

            successfulCount++;
            rowResults.push({
                row_number: rowNumber,
                full_name: attendee.full_name,
                email: attendee.email,
                phone: attendee.phone,
                company_name: attendee.company_name,
                job_title: attendee.job_title,
                status: "imported",
                attendee_id: attendee.id,
            });
        } catch (insertError) {
            failedCount++;
            await AttendeeImportRow.create({
                import_job_id: job.id,
                row_number: rowNumber,
                raw_data: rawRow,
                normalized_email: normalizedEmail,
                validation_errors: [insertError.message],
                attendee_id: null,
                status: "failed",
            });

            rowResults.push({
                row_number: rowNumber,
                full_name: data.full_name,
                email: normalizedEmail,
                status: "failed",
                errors: [insertError.message],
            });
        }
    }

    // 3. Finalize Job metrics
    const totalFailed = failedCount + duplicateCount;
    job.processed_rows = parsedRows.length;
    job.successful_rows = successfulCount;
    job.failed_rows = totalFailed;
    job.status = successfulCount === 0 && parsedRows.length > 0 ? "failed" : "completed";
    job.completed_at = new Date();
    await job.save();

    return {
        job: {
            id: job.id,
            event_id: job.event_id,
            status: job.status,
            total_rows: job.total_rows,
            processed_rows: job.processed_rows,
            successful_rows: job.successful_rows,
            failed_rows: job.failed_rows,
            started_at: job.started_at,
            completed_at: job.completed_at,
        },
        summary: {
            total_rows: parsedRows.length,
            imported: successfulCount,
            duplicates: duplicateCount,
            failed: failedCount,
        },
        rows: rowResults,
    };
}

/**
 * List all bulk import jobs for an event
 */
async function listImportJobs(eventId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await AttendeeImportJob.findAndCountAll({
        where: { event_id: eventId },
        order: [["created_at", "DESC"]],
        limit,
        offset,
    });

    return {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
        jobs: rows,
    };
}

/**
 * Get details of a specific bulk import job including row statuses
 */
async function getImportJobDetails(eventId, jobId) {
    const job = await AttendeeImportJob.findOne({
        where: { id: jobId, event_id: eventId },
        include: [
            {
                model: AttendeeImportRow,
                order: [["row_number", "ASC"]],
            },
        ],
    });

    if (!job) {
        throw new AppError("Import job not found.", 404);
    }

    return job;
}

/**
 * Generates sample CSV template string
 */
function getSampleCsvTemplate() {
    return [
        "Full Name,Email,Phone,Company,Job Title,Bio,Password",
        "Aravind Kumar,aravind@example.com,+919876543210,Tech Solutions,Lead Architect,Cloud & Microservices expert,Confra@2026",
        "Priya Sharma,priya@example.com,+919876543211,Fintech Corp,Product Manager,Passionate about fintech & AI,",
        "Karthik Raja,karthik@example.com,+919876543212,Innovate Labs,Senior Developer,React & Node enthusiast,",
    ].join("\n");
}

module.exports = {
    importAttendees,
    listImportJobs,
    getImportJobDetails,
    getSampleCsvTemplate,
    extractRowData,
};
