
import { Router } from "express"
import { createGuest, getCurrentGuest, logoutGuest} from "../controllers/guest.controller.js"
import { authenticateGuest } from "../middlewares/authenticate-guest.js"

const router = Router()

// Create new guest session
router.post("/sessions", createGuest)

// Get current guest session
router.get("/sessions/me", authenticateGuest, getCurrentGuest)

// Logout current guest session
router.post("/sessions/logout", authenticateGuest, logoutGuest)

export default router
