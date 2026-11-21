
import type { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { createGuestSession, revokeGuestSession } from "../services/guest-session.service.js"

// POST /api/guest/sessions
export async function createGuest( _req: Request, res: Response ) {
    try {
        const { token, session } = await createGuestSession()

        return res.status(201).json({
            success: true,
            message: "Guest session created successfully",
            data: {
                session: {
                    id: session.id,
                    token,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt,
                },
            },
        })
    } catch (error) {
        console.error("Guest session creation failed:", error)

        return res.status(500).json({
            success: false,
            message: "Failed to create guest session",
        })
    }
}

// GET /api/guest/sessions/me
export async function getCurrentGuest( req: Request, res: Response ) {
    try {
        const guestSessionId = req.guestAuth?.guestSessionId

        if (!guestSessionId) {
            return res.status(401).json({
                success: false,
                message: "Guest authentication required",
            })
        }

        const session = await prisma.guestSession.findUnique({
            where: {
                id: guestSessionId,
            },
            select: {
                id: true,
                createdAt: true,
                lastActiveAt: true,
                expiresAt: true,
                revokedAt: true,
            },
        })

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Guest session not found",
            })
        }

        return res.status(200).json({
            success: true,
            message: "Guest session retrieved successfully",
            data: {
                session,
            },
        })
    } catch (error) {
        console.error("Get guest session failed:", error)

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve guest session",
        })
    }
}

// POST /api/guest/sessions/logout
export async function logoutGuest( req: Request, res: Response ) {
    try {
        const guestSessionId = req.guestAuth?.guestSessionId

        if (!guestSessionId) {
            return res.status(401).json({
                success: false,
                message: "Guest authentication required",
            })
        }

        await revokeGuestSession(guestSessionId)

        return res.status(200).json({
            success: true,
            message: "Guest session logged out successfully",
        })
    } catch (error) {
        console.error("Guest logout failed:", error)

        return res.status(500).json({
            success: false,
            message: "Failed to logout guest session",
        })
    }
}
