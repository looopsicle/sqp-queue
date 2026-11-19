import type { Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { hashSessionToken } from "../services/session.service.js"

export async function authenticate( req: Request, res: Response, next: NextFunction) {
    try {
        const authorization = req.headers.authorization;
        const match = authorization?.match(/^Bearer\s+(.+)$/i);

        if (!match) {
        return res.status(401).json({
            success: false,
            code: "UNAUTHORIZED",
            message: "Authentication token is required",
        });
        }

        const token = match[1]?.trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "Authentication token is required",
            })
        }

        const tokenHash = hashSessionToken(token)

        const session = await prisma.userSession.findUnique({
            where: {
                tokenHash,
            },
            select: {
                id: true,
                userId: true,
                expiresAt: true,
                revokedAt: true,
            },
        })

        if (!session) {
            return res.status(401).json({
                success: false,
                code: "INVALID_SESSION",
                message: "Invalid authentication session",
            })
        }

        if (session.revokedAt !== null) {
            return res.status(401).json({
                success: false,
                code: "SESSION_REVOKED",
                message: "Your session has been revoked",
            })
        }

        if (session.expiresAt.getTime() <= Date.now()) {
        return res.status(401).json({
            success: false,
            code: "SESSION_EXPIRED",
            message: "Your session has expired",
        })
        }

        req.auth = {
            userId: session.userId,
            sessionId: session.id,
        }

        next()

    } catch (error) {
        console.error("Authentication middleware failed:", error)

        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication",
        })
    }
}