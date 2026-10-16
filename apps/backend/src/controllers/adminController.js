const adminService = require("../services/adminService");
const { sendResponse } = require("../utils/responseHandler");

async function listAdmins(req, res, next) {
    try {
        const admins = await adminService.listAdmins();
        return sendResponse(res, 200, "Admins retrieved successfully", admins);
    } catch (error) {
        next(error);
    }
}

async function createAdmin(req, res, next) {
    try {
        const admin = await adminService.createAdmin(req.user.id, req.body);
        return sendResponse(res, 201, "Admin created successfully", admin);
    } catch (error) {
        next(error);
    }
}

async function listRoles(req, res, next) {
    try {
        const roles = await adminService.listRoles();
        return sendResponse(res, 200, "Roles retrieved successfully", roles);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listAdmins,
    createAdmin,
    listRoles,
};
