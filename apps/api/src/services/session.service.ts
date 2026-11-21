import { createHash, randomBytes } from "node:crypto"
import { prisma } from "../lib/prisma.js"

export function hashSessionToken(token: string): string {
    return createHash("sha256")
        .update(token)
        .digest("hex")
}

export async function createUserSession(userId: string) {
    const token = randomBytes(32).toString("hex")

    const tokenHash = hashSessionToken(token)

    const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
    )

  const session = await prisma.userSession.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
        select: {
            id: true,
            expiresAt: true,
        },
    })

    return {
        token,
        session,
    }
}

export async function revokeUserSession(sessionId: string) {
    return prisma.userSession.updateMany({
        where: {
            id: sessionId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    })
}