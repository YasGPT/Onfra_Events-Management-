const { Admin, AdminRole, AdminEventAccess } = require("../models");
const AppError = require("../utils/AppError");
const { hashPassword } = require("../utils/passwordUtils");

async function listAdmins() {
    return Admin.findAll({
        attributes: ["id", "full_name", "email", "phone", "is_active", "last_login_at", "created_at"],
        include: [{ model: AdminRole, attributes: ["id", "name", "is_system_role"] }],
        order: [["created_at", "DESC"]],
    });
}

async function createAdmin(creatorAdminId, data) {
    const { full_name, email, phone, password, role_id } = data;

    if (!full_name || !email || !password || !role_id) {
        throw new AppError("Full name, email, password, and role are required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ where: { email: normalizedEmail } });
    if (existing) {
        throw new AppError("An administrator with this email already exists.", 409);
    }

    const password_hash = await hashPassword(password);
    const admin = await Admin.create({
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone,
        password_hash,
        role_id,
        is_active: true,
    });

    return Admin.findByPk(admin.id, {
        attributes: ["id", "full_name", "email", "phone", "is_active", "created_at"],
        include: [{ model: AdminRole, attributes: ["id", "name"] }],
    });
}

async function listRoles() {
    return AdminRole.findAll({
        attributes: ["id", "name", "description", "is_system_role"],
        order: [["name", "ASC"]],
    });
}

module.exports = {
    listAdmins,
    createAdmin,
    listRoles,
};
