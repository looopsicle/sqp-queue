import type { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { revokeUserSession } from "../services/session.service.js"

// GET /api/auth/me
export async function getCurrentUser( req: Request, res: Response ) {
    try {
        const userId = req.auth!.userId

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                createdAt: true,
                oauthAccounts: {
                    select: {
                        provider: true,
                        email: true,
                    },
                },
            },
        })

        if (!user) {
            return res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "User not found",
            })
        }

        return res.status(200).json({
            success: true,
            message: "Current user retrieved successfully",
            data: {
                user,
            },
        })

    } catch (error) {
        console.error("Get current user failed:", error)

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve current user",
        })
    }
}

// POST /api/auth/logout
export async function logout( req: Request, res: Response ) {
    try {
        const sessionId = req.auth!.sessionId

        await revokeUserSession(sessionId)

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        })

    } catch (error) {
        console.error("Logout failed:", error)

        return res.status(500).json({
            success: false,
            message: "Failed to logout",
        })
    }
}