
import { Router } from "express"
import { authenticate } from "../middlewares/authenticate.js"
import { authorizeRole } from "../middlewares/staff-authorization.js"
import {
    assignStaffController,
    createShiftController,
    deleteShiftController,
    getShiftById,
    getShifts,
    removeStaffController,
    updateShiftController,
} from "../controllers/shift.controller.js"

const router = Router()

// Semua endpoint Shift Management hanya untuk SUPER_ADMIN.
router.use(authenticate)
router.use(authorizeRole("SUPER_ADMIN"))

// Shift CRUD
router.get("/", getShifts)
router.get("/:id", getShiftById)
router.post("/", createShiftController)
router.patch("/:id", updateShiftController)
router.delete("/:id", deleteShiftController)

// Shift assignments
router.post("/:id/assignments", assignStaffController)
router.delete(
    "/:id/assignments/:staffId",
    removeStaffController,
)

export default router