import { Router } from "express"

import {
    getStaff,
    getStaffById,
    createStaffProfile,
    updateStaffProfile,
    deactivateStaffProfile,
} from "../controllers/staff.controller.js"

import { authenticate } from "../middlewares/authenticate.js"
import { authorizeRole } from "../middlewares/staff-authorization.js"

const router = Router()

// All staff management endpoints require an authenticated Super Admin.
router.use(authenticate)
router.use(authorizeRole("SUPER_ADMIN"))

// GET /api/staff
router.get("/", getStaff)

// GET /api/staff/:id
router.get("/:id", getStaffById)

// POST /api/staff
router.post("/", createStaffProfile)

// PATCH /api/staff/:id
router.patch("/:id", updateStaffProfile)

// DELETE /api/staff/:id
// Soft-deactivate staff account.
router.delete("/:id", deactivateStaffProfile)

export default router