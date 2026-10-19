const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireUserType } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authenticate, requireUserType("admin"));

router.get("/roles", adminController.listRoles);
router.get("/", adminController.listAdmins);
router.post("/", adminController.createAdmin);

module.exports = router;
