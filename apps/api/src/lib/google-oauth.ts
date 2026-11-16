
import { OAuth2Client } from "google-auth-library"

const googleClient = new OAuth2Client()

export async function verifyGoogleIdToken(idToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID

    if (!clientId) {
        throw new Error("GOOGLE_CLIENT_ID is not configured")
    }

    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: clientId,
    })

    const payload = ticket.getPayload()

    if (!payload || !payload.sub) {
        throw new Error("Invalid Google ID token payload")
    }

    if (!payload.email || payload.email_verified !== true) {
        throw new Error("Google email is missing or not verified")
    }

    return {
        providerAccountId: payload.sub,
        email: payload.email,
    }
}
