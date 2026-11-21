import { randomBytes } from "node:crypto"
import { prisma } from "../lib/prisma.js"
import { hashSessionToken } from "./session.service.js"

export async function createGuestSession() {
    const token = randomBytes(32).toString("hex")

    const tokenHash = hashSessionToken(token)

    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    )

    const session = await prisma.guestSession.create({
        data: {
            tokenHash,
            expiresAt,
        },
        select: {
            id: true,
            createdAt: true,
            expiresAt: true,
        },
    })

    return {
        token,
        session,
    }
}

export async function revokeGuestSession(sessionId: string) {
    return prisma.guestSession.updateMany({
        where: {
            id: sessionId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    })
}