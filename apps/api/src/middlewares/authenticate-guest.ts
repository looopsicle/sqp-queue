
import type { Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { hashSessionToken } from "../services/session.service.js"

export async function authenticateGuest( req: Request, res: Response, next: NextFunction ) {
    try {
        const authorization = req.headers.authorization
        const match = authorization?.match(/^Bearer\s+(.+)$/i)

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Guest session token is required",
            })
        }

        const token = match[1]?.trim()

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Guest session token is required",
            })
        }

        const tokenHash = hashSessionToken(token)

        const session = await prisma.guestSession.findUnique({
            where: {
                tokenHash,
            },
            select: {
                id: true,
                expiresAt: true,
                revokedAt: true,
            },
        })

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Invalid guest session",
            })
        }

        if (session.revokedAt !== null) {
            return res.status(401).json({
                success: false,
                message: "Guest session has been revoked",
            })
        }

        if (session.expiresAt.getTime() <= Date.now()) {
            return res.status(401).json({
                success: false,
                message: "Guest session has expired",
            })
        }

        await prisma.guestSession.update({
            where: {
                id: session.id,
            },
            data: {
                lastActiveAt: new Date(),
            },
        })

        req.guestAuth = {
            guestSessionId: session.id,
        }

        next()
    } catch (error) {
        console.error("Guest authentication failed:", error)

        return res.status(500).json({
            success: false,
            message: "Failed to authenticate guest session",
        })
    }
}
