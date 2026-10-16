const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireUserType, requireRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authenticate, requireUserType("admin"));

router.get("/roles", adminController.listRoles);
router.get("/", requireRoles("Super Admin"), adminController.listAdmins);
router.post("/", requireRoles("Super Admin"), adminController.createAdmin);

module.exports = router;
