const { DataTypes } = require("sequelize");

// All event-scoped tables live in the single "public" schema, separated by event_id
const schemaName = "public";

function defineEventModels(sequelize) {
    const opts = (tableName) => ({
        schema: schemaName,
        tableName,
        timestamps: false,
    });

    const optsWithTimestamps = (tableName) => ({
        schema: schemaName,
        tableName,
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    });

    // Helper for event_id foreign key referencing public.events(id)
    const eventIdField = {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: { tableName: "events", schema: schemaName },
            key: "id",
        },
        onDelete: "CASCADE",
    };

    // 1. Media Assets
    const MediaAsset = sequelize.define(
        "MediaAsset",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "events", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            storage_key: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            original_filename: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            mime_type: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            file_size_bytes: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            access_scope: {
                type: DataTypes.STRING(20),
                defaultValue: "public",
            },
            uploaded_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            uploaded_by_attendee_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("media_assets")
    );

    // 2. Event Settings
    const EventSetting = sequelize.define(
        "EventSetting",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            setting_key: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            setting_value: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            updated_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("event_settings")
    );

    // 3. Event Days
    const EventDay = sequelize.define(
        "EventDay",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            day_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            event_date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("event_days")
    );

    // 4. Tracks
    const Track = sequelize.define(
        "Track",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("tracks")
    );

    // 5. Venues
    const Venue = sequelize.define(
        "Venue",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            location_details: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("venues")
    );

    // 6. Attendees
    const Attendee = sequelize.define(
        "Attendee",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            full_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            password_hash: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            password_setup_token: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            password_setup_token_expires_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            company_name: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            job_title: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            website_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            whatsapp_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            photo_asset_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            qr_token_hash: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            registration_status: {
                type: DataTypes.STRING(20),
                defaultValue: "registered",
            },
            registered_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            registered_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            email_verified_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            ...optsWithTimestamps("attendees"),
            indexes: [
                {
                    unique: true,
                    fields: ["event_id", "email"],
                },
            ],
        }
    );

    // 7. Attendee Sessions
    const AttendeeSession = sequelize.define(
        "AttendeeSession",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            refresh_token_hash: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        opts("attendee_sessions")
    );

    // 8. Attendee Password Reset Tokens
    const AttendeePasswordResetToken = sequelize.define(
        "AttendeePasswordResetToken",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            token_hash: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            used_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("attendee_password_reset_tokens")
    );

    // 9. Attendee Privacy Settings
    const AttendeePrivacySetting = sequelize.define(
        "AttendeePrivacySetting",
        {
            attendee_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            field_name: {
                type: DataTypes.STRING(50),
                primaryKey: true,
                allowNull: false,
            },
            directory_visible: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            allow_qr_share: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("attendee_privacy_settings")
    );

    // 10. Exhibitor Categories
    const ExhibitorCategory = sequelize.define(
        "ExhibitorCategory",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("exhibitor_categories")
    );

    // 11. Exhibitors
    const Exhibitor = sequelize.define(
        "Exhibitor",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            category_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "exhibitor_categories", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            logo_asset_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            representative_attendee_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            company_name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            website_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            contact_name: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },
            contact_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            contact_phone: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "active",
            },
            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            created_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        optsWithTimestamps("exhibitors")
    );

    // 12. Exhibitor Offerings
    const ExhibitorOffering = sequelize.define(
        "ExhibitorOffering",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            exhibitor_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "exhibitors", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            offering_type: {
                type: DataTypes.STRING(20),
                defaultValue: "product",
            },
            name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("exhibitor_offerings")
    );

    // 13. Event Floor Maps
    const EventFloorMap = sequelize.define(
        "EventFloorMap",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            media_asset_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            uploaded_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            uploaded_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("event_floor_maps")
    );

    // 14. Stalls
    const Stall = sequelize.define(
        "Stall",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            floor_map_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "event_floor_maps", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            exhibitor_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "exhibitors", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            stall_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            x_percent: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
            },
            y_percent: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("stalls")
    );

    // 15. Sponsorship Tiers
    const SponsorshipTier = sequelize.define(
        "SponsorshipTier",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
        },
        opts("sponsorship_tiers")
    );

    // 16. Sponsors
    const Sponsor = sequelize.define(
        "Sponsor",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            tier_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "sponsorship_tiers", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            representative_attendee_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            organization_type: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            organization_name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            logo_asset_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            representative_name: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },
            contact_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            contact_phone: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            website_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "active",
            },
            created_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        optsWithTimestamps("sponsors")
    );

    // 17. Sessions
    const Session = sequelize.define(
        "Session",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            event_day_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "event_days", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            track_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "tracks", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            venue_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "venues", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            title: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            starts_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            ends_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "scheduled",
            },
            created_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        optsWithTimestamps("sessions")
    );

    // 18. Speakers
    const Speaker = sequelize.define(
        "Speaker",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            full_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            job_title: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },
            organization: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            photo_asset_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("speakers")
    );

    // 19. Session Speakers
    const SessionSpeaker = sequelize.define(
        "SessionSpeaker",
        {
            session_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: { tableName: "sessions", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            speaker_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: { tableName: "speakers", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
        },
        opts("session_speakers")
    );

    // 20. Saved Sessions
    const SavedSession = sequelize.define(
        "SavedSession",
        {
            attendee_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            session_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: { tableName: "sessions", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            saved_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("saved_sessions")
    );

    // 21. Connections
    const Connection = sequelize.define(
        "Connection",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            attendee_a_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            attendee_b_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            requested_by_attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "pending",
            },
            requested_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            responded_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            removed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        opts("connections")
    );

    // 22. Connection Shared Fields
    const ConnectionSharedField = sequelize.define(
        "ConnectionSharedField",
        {
            connection_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: { tableName: "connections", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            owner_attendee_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            field_name: {
                type: DataTypes.STRING(50),
                primaryKey: true,
                allowNull: false,
            },
            is_shared: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            consented_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("connection_shared_fields")
    );

    // 23. Conversations
    const Conversation = sequelize.define(
        "Conversation",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            connection_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "connections", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            last_message_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        opts("conversations")
    );

    // 24. Messages
    const Message = sequelize.define(
        "Message",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            conversation_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "conversations", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            sender_attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            message_text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            sent_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            read_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        opts("messages")
    );

    // 25. Meetings
    const Meeting = sequelize.define(
        "Meeting",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            requester_attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            recipient_attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            starts_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            ends_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            venue_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "venues", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            location_details: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            purpose: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "pending",
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            responded_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            cancelled_by_attendee_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        optsWithTimestamps("meetings")
    );

    // 26. Meeting Reschedule Requests
    const MeetingRescheduleRequest = sequelize.define(
        "MeetingRescheduleRequest",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            meeting_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "meetings", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            requested_by_attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            proposed_starts_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            proposed_ends_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            proposed_venue_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "venues", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            proposed_location_details: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "pending",
            },
            responded_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("meeting_reschedule_requests")
    );

    // 27. Albums
    const Album = sequelize.define(
        "Album",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "active",
            },
            created_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        optsWithTimestamps("albums")
    );

    // 28. Gallery Photos
    const GalleryPhoto = sequelize.define(
        "GalleryPhoto",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            album_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "albums", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            media_asset_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "media_assets", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            owner_attendee_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            visibility: {
                type: DataTypes.STRING(20),
                defaultValue: "public",
            },
            is_published: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("gallery_photos")
    );

    // 29. Announcements
    const Announcement = sequelize.define(
        "Announcement",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            title: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            body: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "draft",
            },
            created_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            published_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        optsWithTimestamps("announcements")
    );

    // 30. Attendee Devices
    const AttendeeDevice = sequelize.define(
        "AttendeeDevice",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            platform: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            push_token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            last_seen_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        optsWithTimestamps("attendee_devices")
    );

    // 31. Notifications
    const Notification = sequelize.define(
        "Notification",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            recipient_attendee_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            announcement_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "announcements", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            notification_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            body: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            related_entity_type: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            related_entity_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            deduplication_key: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            read_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("notifications")
    );

    // 32. Notification Deliveries
    const NotificationDelivery = sequelize.define(
        "NotificationDelivery",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            notification_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "notifications", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            device_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendee_devices", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "pending",
            },
            provider_message_id: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            failure_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            attempt_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            sent_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("notification_deliveries")
    );

    // 33. Attendee Import Jobs
    const AttendeeImportJob = sequelize.define(
        "AttendeeImportJob",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            uploaded_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            source_asset_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "pending",
            },
            total_rows: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            processed_rows: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            successful_rows: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            failed_rows: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            started_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            completed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("attendee_import_jobs")
    );

    // 34. Attendee Import Rows
    const AttendeeImportRow = sequelize.define(
        "AttendeeImportRow",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            import_job_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: { tableName: "attendee_import_jobs", schema: schemaName },
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            row_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            raw_data: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            normalized_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            validation_errors: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            attendee_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: { tableName: "attendees", schema: schemaName },
                    key: "id",
                },
                onDelete: "SET NULL",
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "pending",
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        opts("attendee_import_rows")
    );

    // 35. Report Exports
    const ReportExport = sequelize.define(
        "ReportExport",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            event_id: eventIdField,
            requested_by_admin_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            report_type: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            filters: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING(20),
                defaultValue: "pending",
            },
            output_asset_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            failure_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            requested_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            completed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        opts("report_exports")
    );

    // Associations within schema
    Attendee.hasMany(AttendeeSession, { foreignKey: "attendee_id" });
    AttendeeSession.belongsTo(Attendee, { foreignKey: "attendee_id" });

    Attendee.hasMany(AttendeePrivacySetting, { foreignKey: "attendee_id" });
    AttendeePrivacySetting.belongsTo(Attendee, { foreignKey: "attendee_id" });

    ExhibitorCategory.hasMany(Exhibitor, { foreignKey: "category_id" });
    Exhibitor.belongsTo(ExhibitorCategory, { foreignKey: "category_id" });

    Exhibitor.hasMany(ExhibitorOffering, { foreignKey: "exhibitor_id" });
    ExhibitorOffering.belongsTo(Exhibitor, { foreignKey: "exhibitor_id" });

    EventFloorMap.hasMany(Stall, { foreignKey: "floor_map_id" });
    Stall.belongsTo(EventFloorMap, { foreignKey: "floor_map_id" });

    Exhibitor.hasMany(Stall, { foreignKey: "exhibitor_id" });
    Stall.belongsTo(Exhibitor, { foreignKey: "exhibitor_id" });

    SponsorshipTier.hasMany(Sponsor, { foreignKey: "tier_id" });
    Sponsor.belongsTo(SponsorshipTier, { foreignKey: "tier_id" });

    EventDay.hasMany(Session, { foreignKey: "event_day_id" });
    Session.belongsTo(EventDay, { foreignKey: "event_day_id" });

    Track.hasMany(Session, { foreignKey: "track_id" });
    Session.belongsTo(Track, { foreignKey: "track_id" });

    Venue.hasMany(Session, { foreignKey: "venue_id" });
    Session.belongsTo(Venue, { foreignKey: "venue_id" });

    Session.belongsToMany(Speaker, {
        through: SessionSpeaker,
        foreignKey: "session_id",
        otherKey: "speaker_id",
    });
    Speaker.belongsToMany(Session, {
        through: SessionSpeaker,
        foreignKey: "speaker_id",
        otherKey: "session_id",
    });

    Attendee.belongsToMany(Session, {
        through: SavedSession,
        foreignKey: "attendee_id",
        otherKey: "session_id",
    });
    Session.belongsToMany(Attendee, {
        through: SavedSession,
        foreignKey: "session_id",
        otherKey: "attendee_id",
    });

    SavedSession.belongsTo(Session, { foreignKey: "session_id" });
    Session.hasMany(SavedSession, { foreignKey: "session_id" });
    SavedSession.belongsTo(Attendee, { foreignKey: "attendee_id" });
    Attendee.hasMany(SavedSession, { foreignKey: "attendee_id" });

    SessionSpeaker.belongsTo(Session, { foreignKey: "session_id" });
    Session.hasMany(SessionSpeaker, { foreignKey: "session_id" });
    SessionSpeaker.belongsTo(Speaker, { foreignKey: "speaker_id" });
    Speaker.hasMany(SessionSpeaker, { foreignKey: "speaker_id" });

    Connection.hasOne(Conversation, { foreignKey: "connection_id" });
    Conversation.belongsTo(Connection, { foreignKey: "connection_id" });

    Conversation.hasMany(Message, { foreignKey: "conversation_id" });
    Message.belongsTo(Conversation, { foreignKey: "conversation_id" });

    Meeting.hasMany(MeetingRescheduleRequest, { foreignKey: "meeting_id" });
    MeetingRescheduleRequest.belongsTo(Meeting, { foreignKey: "meeting_id" });

    Meeting.belongsTo(Venue, { foreignKey: "venue_id" });
    Venue.hasMany(Meeting, { foreignKey: "venue_id" });
    Meeting.belongsTo(Attendee, { foreignKey: "requester_attendee_id", as: "requester" });
    Meeting.belongsTo(Attendee, { foreignKey: "recipient_attendee_id", as: "recipient" });

    Album.hasMany(GalleryPhoto, { foreignKey: "album_id" });
    GalleryPhoto.belongsTo(Album, { foreignKey: "album_id" });

    Attendee.hasMany(AttendeeDevice, { foreignKey: "attendee_id" });
    AttendeeDevice.belongsTo(Attendee, { foreignKey: "attendee_id" });

    Attendee.hasMany(Notification, { foreignKey: "recipient_attendee_id" });
    Notification.belongsTo(Attendee, { foreignKey: "recipient_attendee_id" });

    Notification.hasMany(NotificationDelivery, { foreignKey: "notification_id" });
    NotificationDelivery.belongsTo(Notification, { foreignKey: "notification_id" });

    AttendeeImportJob.hasMany(AttendeeImportRow, { foreignKey: "import_job_id" });
    AttendeeImportRow.belongsTo(AttendeeImportJob, { foreignKey: "import_job_id" });

    return {
        MediaAsset,
        EventSetting,
        EventDay,
        Track,
        Venue,
        Attendee,
        AttendeeSession,
        AttendeePasswordResetToken,
        AttendeePrivacySetting,
        ExhibitorCategory,
        Exhibitor,
        ExhibitorOffering,
        EventFloorMap,
        Stall,
        SponsorshipTier,
        Sponsor,
        Session,
        Speaker,
        SessionSpeaker,
        SavedSession,
        Connection,
        ConnectionSharedField,
        Conversation,
        Message,
        Meeting,
        MeetingRescheduleRequest,
        Album,
        GalleryPhoto,
        Announcement,
        AttendeeDevice,
        Notification,
        NotificationDelivery,
        AttendeeImportJob,
        AttendeeImportRow,
        ReportExport,
    };
}

module.exports = defineEventModels;
