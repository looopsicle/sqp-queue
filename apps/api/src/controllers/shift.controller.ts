
import type { Request, Response } from "express"
import {
    assignStaffToShift,
    createShift,
    deleteShift,
    findShiftById,
    InactiveStaffError,
    InvalidShiftTimeError,
    listShifts,
    removeStaffFromShift,
    ShiftAssignmentHasLogsError,
    ShiftAssignmentNotFoundError,
    ShiftHasAssignmentsError,
    ShiftNotFoundError,
    ShiftOverlapError,
    StaffNotFoundError,
    updateShift,
} from "../services/shift.service.js"

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getParamId(req: Request, paramName: string): string | null {
    const id = req.params[paramName]

    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
        return null
    }

    return id
}

function parseDate(value: unknown): Date | null {
    if (typeof value !== "string" || value.trim() === "") {
        return null
    }

    const date = new Date(value)

    if (!Number.isFinite(date.getTime())) {
        return null
    }

    return date
}

function isPrismaError(
    error: unknown,
    code: string,
): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === code
    )
}

function handleShiftError(res: Response, error: unknown) {
    if (error instanceof ShiftNotFoundError) {
        return res.status(404).json({
            success: false,
            code: "SHIFT_NOT_FOUND",
            message: error.message,
        })
    }

    if (error instanceof StaffNotFoundError) {
        return res.status(404).json({
            success: false,
            code: "STAFF_NOT_FOUND",
            message: error.message,
        })
    }

    if (error instanceof InactiveStaffError) {
        return res.status(409).json({
            success: false,
            code: "STAFF_INACTIVE",
            message: error.message,
        })
    }

    if (error instanceof ShiftAssignmentNotFoundError) {
        return res.status(404).json({
            success: false,
            code: "SHIFT_ASSIGNMENT_NOT_FOUND",
            message: error.message,
        })
    }

    if (error instanceof ShiftOverlapError) {
        return res.status(409).json({
            success: false,
            code: "SHIFT_OVERLAP",
            message: error.message,
        })
    }

    if (error instanceof ShiftHasAssignmentsError) {
        return res.status(409).json({
            success: false,
            code: "SHIFT_HAS_ASSIGNMENTS",
            message: error.message,
        })
    }

    if (error instanceof ShiftAssignmentHasLogsError) {
        return res.status(409).json({
            success: false,
            code: "SHIFT_ASSIGNMENT_HAS_LOGS",
            message: error.message,
        })
    }

    if (error instanceof InvalidShiftTimeError) {
        return res.status(400).json({
            success: false,
            code: "INVALID_SHIFT_TIME",
            message: error.message,
        })
    }

    if (isPrismaError(error, "P2002")) {
        return res.status(409).json({
            success: false,
            code: "DUPLICATE_SHIFT_ASSIGNMENT",
            message: "This staff member is already assigned to this shift.",
        })
    }

    if (isPrismaError(error, "P2003")) {
        return res.status(409).json({
            success: false,
            code: "RELATED_RECORD_EXISTS",
            message: "This record cannot be deleted because it is referenced by another record.",
        })
    }

    console.error("Shift controller error:", error)

    return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
    })
}

// =========================
// GET /api/shifts
// =========================

export async function getShifts(
    _req: Request,
    res: Response,
) {
    try {
        const shifts = await listShifts()

        return res.status(200).json({
            success: true,
            data: shifts,
        })
    } catch (error) {
        return handleShiftError(res, error)
    }
}

// =========================
// GET /api/shifts/:id
// =========================

export async function getShiftById(
    req: Request,
    res: Response,
) {
    const id = getParamId(req, "id")

    if (!id) {
        return res.status(400).json({
            success: false,
            code: "INVALID_SHIFT_ID",
            message: "A valid shift ID is required.",
        })
    }

    try {
        const shift = await findShiftById(id)

        return res.status(200).json({
            success: true,
            data: shift,
        })
    } catch (error) {
        return handleShiftError(res, error)
    }
}

// =========================
// POST /api/shifts
// =========================

export async function createShiftController(
    req: Request,
    res: Response,
) {
    const startedAt = parseDate(req.body?.startedAt)
    const endedAt = parseDate(req.body?.endedAt)

    if (!startedAt || !endedAt) {
        return res.status(400).json({
            success: false,
            code: "INVALID_SHIFT_DATE",
            message: "Valid startedAt and endedAt ISO date strings are required.",
        })
    }

    try {
        const shift = await createShift({
            startedAt,
            endedAt,
        })

        return res.status(201).json({
            success: true,
            data: shift,
        })
    } catch (error) {
        return handleShiftError(res, error)
    }
}

// =========================
// PATCH /api/shifts/:id
// =========================

export async function updateShiftController(
    req: Request,
    res: Response,
) {
    const id = getParamId(req, "id")

    if (!id) {
        return res.status(400).json({
            success: false,
            code: "INVALID_SHIFT_ID",
            message: "A valid shift ID is required.",
        })
    }

    const body = req.body;

    if (
        !body ||
        typeof body !== "object" ||
        (!("startedAt" in body) && !("endedAt" in body))
    ) {
        return res.status(400).json({
            success: false,
            code: "INVALID_REQUEST_BODY",
            message: "At least one of startedAt or endedAt must be provided.",
        })
    }

    const data: {
        startedAt?: Date
        endedAt?: Date
    } = {}

    if ("startedAt" in body) {
        const parsed = parseDate(body.startedAt)

        if (!parsed) {
            return res.status(400).json({
                success: false,
                code: "INVALID_STARTED_AT",
                message: "startedAt must be a valid ISO date string.",
            })
        }

        data.startedAt = parsed
    }

    if ("endedAt" in body) {
        const parsed = parseDate(body.endedAt)

        if (!parsed) {
            return res.status(400).json({
                success: false,
                code: "INVALID_ENDED_AT",
                message: "endedAt must be a valid ISO date string.",
            })
        }

        data.endedAt = parsed
    }

    try {
        const shift = await updateShift(id, data)

        return res.status(200).json({
            success: true,
            data: shift,
        })
    } catch (error) {
        return handleShiftError(res, error)
    }
}

// =========================
// DELETE /api/shifts/:id
// =========================

export async function deleteShiftController(
    req: Request,
    res: Response,
) {
    const id = getParamId(req, "id")

    if (!id) {
        return res.status(400).json({
            success: false,
            code: "INVALID_SHIFT_ID",
            message: "A valid shift ID is required.",
        })
    }

    try {
        await deleteShift(id);

        return res.status(200).json({
            success: true,
            message: "Shift deleted successfully.",
        })
    } catch (error) {
        return handleShiftError(res, error)
    }
}

// =========================
// POST /api/shifts/:id/assignments
// =========================

export async function assignStaffController(
    req: Request,
    res: Response,
) {
    const shiftId = getParamId(req, "id")
    const staffProfileId = req.body?.staffProfileId

    if (!shiftId) {
        return res.status(400).json({
            success: false,
            code: "INVALID_SHIFT_ID",
            message: "A valid shift ID is required.",
        })
    }

    if (
        typeof staffProfileId !== "string" ||
        !UUID_REGEX.test(staffProfileId)
    ) {
        return res.status(400).json({
            success: false,
            code: "INVALID_STAFF_PROFILE_ID",
            message: "A valid staffProfileId is required.",
        })
    }

    try {
        const assignment = await assignStaffToShift(
            shiftId,
            staffProfileId,
        )

        return res.status(201).json({
            success: true,
            data: assignment,
        })
    } catch (error) {
        return handleShiftError(res, error)
    }
}

// =========================
// DELETE /api/shifts/:id/assignments/:staffId
// =========================

export async function removeStaffController(
    req: Request,
    res: Response,
) {
    const shiftId = getParamId(req, "id")
    const staffProfileId = getParamId(req, "staffId")

    if (!shiftId || !staffProfileId) {
        return res.status(400).json({
            success: false,
            code: "INVALID_ID",
            message: "Valid shift ID and staff profile ID are required.",
        })
    }

    try {
        await removeStaffFromShift(
            shiftId,
            staffProfileId,
        )

        return res.status(200).json({
            success: true,
            message: "Staff assignment removed successfully.",
        })
    } catch (error) {
        return handleShiftError(res, error)
    }
}