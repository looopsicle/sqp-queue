
import type { Request, Response, NextFunction } from "express";

import {
    listStaff,
    findStaffById,
    createStaff,
    updateStaff,
    deactivateStaff,
    StaffUserNotFoundError,
    StaffProfileNotFoundError,
    LastActiveSuperAdminError,
} from "../services/staff.service.js";

import type { StaffRole } from "../middlewares/staff-authorization.js";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isStaffRole(value: unknown): value is StaffRole {
    return value === "STAFF" || value === "SUPER_ADMIN"
}

function getStaffId(req: Request): string | null {
    const id = req.params.id

    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
        return null
    }

    return id
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
    )
}

// GET /api/staff
export async function getStaff(
    _req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const staff = await listStaff()

        return res.status(200).json({
            success: true,
            data: staff,
        })
    } catch (error) {
        next(error)
    }
}

// GET /api/staff/:id
export async function getStaffById(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const id = getStaffId(req)
        
        if (!id) {
            return res.status(400).json({
                success: false,
                code: "INVALID_STAFF_ID",
                message: "Staff ID must be a valid UUID.",
            })
        }

        const staff = await findStaffById(id)

        if (!staff) {
            return res.status(404).json({
                success: false,
                code: "STAFF_NOT_FOUND",
                message: "Staff profile not found.",
            })
        }

        return res.status(200).json({
            success: true,
            data: staff,
        })
    } catch (error) {
        next(error);
    }
}

// POST /api/staff
export async function createStaffProfile(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { userId, employeeCode, role } = req.body;

        if (
            typeof userId !== "string" ||
            !UUID_REGEX.test(userId)
        ) {
            return res.status(400).json({
                success: false,
                code: "INVALID_USER_ID",
                message: "User ID must be a valid UUID.",
            })
        }

        if (
            typeof employeeCode !== "string" ||
            employeeCode.trim().length === 0
        ) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EMPLOYEE_CODE",
                message: "Employee code is required.",
            })
        }

        if (role !== undefined && !isStaffRole(role)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_STAFF_ROLE",
                message: "Role must be STAFF or SUPER_ADMIN.",
            })
        }

        const staff = await createStaff({
            userId,
            employeeCode: employeeCode.trim(),
            role,
        })

        return res.status(201).json({
            success: true,
            message: "Staff profile created successfully.",
            data: staff,
        })
    } catch (error) {
        if (error instanceof StaffUserNotFoundError) {
            return res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: error.message,
            })
        }

        if (isPrismaUniqueConstraintError(error)) {
            return res.status(409).json({
                success: false,
                code: "STAFF_ALREADY_EXISTS_OR_DUPLICATE",
                message:
                    "The user already has a staff profile or the employee code is already in use.",
            })
        }

        next(error)
    }
}

// PATCH /api/staff/:id
export async function updateStaffProfile(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const id = getStaffId(req);
        const { employeeCode, role } = req.body

        if (!id) {
            return res.status(400).json({
                success: false,
                code: "INVALID_STAFF_ID",
                message: "Staff ID must be a valid UUID.",
            })
        }

        const data: {
            employeeCode?: string;
            role?: StaffRole;
        } = {}

        if (employeeCode !== undefined) {
            if (
                typeof employeeCode !== "string" ||
                employeeCode.trim().length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_EMPLOYEE_CODE",
                    message: "Employee code cannot be empty.",
                })
            }

            data.employeeCode = employeeCode.trim()
        }

        if (role !== undefined) {
            if (!isStaffRole(role)) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_STAFF_ROLE",
                    message: "Role must be STAFF or SUPER_ADMIN.",
                })
            }

            data.role = role
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                code: "EMPTY_UPDATE",
                message: "At least one field must be provided.",
            })
        }

        const staff = await updateStaff(id, data)

        return res.status(200).json({
            success: true,
            message: "Staff profile updated successfully.",
            data: staff,
        })
    } catch (error) {
        if (error instanceof StaffProfileNotFoundError) {
            return res.status(404).json({
                success: false,
                code: "STAFF_NOT_FOUND",
                message: error.message,
            })
        }

        if (error instanceof LastActiveSuperAdminError) {
            return res.status(409).json({
                success: false,
                code: "LAST_ACTIVE_SUPER_ADMIN",
                message: error.message,
            })
        }

        if (isPrismaUniqueConstraintError(error)) {
            return res.status(409).json({
                success: false,
                code: "DUPLICATE_EMPLOYEE_CODE",
                message: "Employee code is already in use.",
            })
        }

        next(error)
    }
}

// DELETE /api/staff/:id
// Soft delete: only changes isActive to false.
export async function deactivateStaffProfile(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const id = getStaffId(req)

        if (!id) {
            return res.status(400).json({
                success: false,
                code: "INVALID_STAFF_ID",
                message: "Staff ID must be a valid UUID.",
            })
        }

        const staff = await deactivateStaff(id)

        return res.status(200).json({
            success: true,
            message: "Staff account deactivated successfully.",
            data: staff,
        })
    } catch (error) {
        if (error instanceof StaffProfileNotFoundError) {
            return res.status(404).json({
                success: false,
                code: "STAFF_NOT_FOUND",
                message: error.message,
            })
        }

        if (error instanceof LastActiveSuperAdminError) {
            return res.status(409).json({
                success: false,
                code: "LAST_ACTIVE_SUPER_ADMIN",
                message: error.message,
            })
        }

        next(error)
    }
}