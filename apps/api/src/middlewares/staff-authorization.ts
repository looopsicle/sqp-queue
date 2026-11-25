import type { Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"

export type StaffRole = "SUPER_ADMIN" | "STAFF"

export function authorizeRole(...allowedRoles: StaffRole[]) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            if (!req.auth) {
                return res.status(401).json({
                    success: false,
                    code: "UNAUTHORIZED",
                    message: "Authentication is required.",
                })
            }

            const staffProfile = await prisma.staffProfile.findUnique({
                where: {
                    userId: req.auth.userId,
                },
                select: {
                    role: true,
                },
            })

            if (!staffProfile) {
                return res.status(403).json({
                    success: false,
                    code: "STAFF_ACCESS_REQUIRED",
                    message: "Staff access is required.",
                })
            }

            if (!allowedRoles.includes(staffProfile.role)) {
                return res.status(403).json({
                    success: false,
                    code: "INSUFFICIENT_ROLE",
                    message: "You do not have permission to access this resource.",
                })
            }

            next()
        } catch (error) {
            next(error)
        }
    }
}