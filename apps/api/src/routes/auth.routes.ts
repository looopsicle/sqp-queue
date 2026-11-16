
import { Router } from "express"

import { prisma } from "../lib/prisma.js"
import { verifyGoogleIdToken } from "../lib/google-oauth.js"

const router = Router()

function isPrismaUniqueError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
    )
}

// POST /api/auth/google/register
router.post("/google/register", async (req, res) => {
    const { idToken } = req.body ?? {}

    if (typeof idToken !== "string" || !idToken.trim()) {
        return res.status(400).json({
            success: false,
            message: "Google ID token is required",
        })
    }

    let googleUser

    try {
        googleUser = await verifyGoogleIdToken(idToken)
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "GOOGLE_CLIENT_ID is not configured"
        ) {
            console.error(error.message)

            return res.status(500).json({
                success: false,
                message: "Google authentication is not configured",
            })
        }

        return res.status(401).json({
            success: false,
            message: "Invalid or expired Google ID token",
        })
    }

    // Check whether Google account already exists
    const existingAccount = await prisma.oAuthAccount.findUnique({
        where: {
        provider_providerAccountId: {
            provider: "google",
            providerAccountId: googleUser.providerAccountId,
        },
        },
            select: {
            id: true,
        },
    })

    if (existingAccount) {
        return res.status(409).json({
            success: false,
            code: "ACCOUNT_ALREADY_REGISTERED",
            message: "This Google account is already registered. Please login instead.",
        })
    }

    try {
        const user = await prisma.user.create({
        data: {
            oauthAccounts: {
                create: {
                    provider: "google",
                    providerAccountId: googleUser.providerAccountId,
                    email: googleUser.email,
                },
            },
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
    return res.status(201).json({
        success: true,
        message: "Google account registered successfully",
        data: {
            user,
        },
    })
    } catch (error) {
        if (isPrismaUniqueError(error)) {
            return res.status(409).json({
                success: false,
                code: "ACCOUNT_ALREADY_REGISTERED",
                message: "This Google account is already registered. Please login instead.",
            })
        }

        console.error("Google registration failed:", error)

        return res.status(500).json({
            success: false,
            message: "Failed to register Google account",
        })
    }
})

export default router