import { Router } from "express"
import { 
    getAttractions, 
    getAttractionById, 
    createAttraction,
    updateAttractionController,
    deleteAttractionController,
} from "../controllers/attraction.controller.js"

import { authenticate } from "../middlewares/authenticate.js"
import { authorizeRole } from "../middlewares/staff-authorization.js"

const router = Router()

//public routes
router.get("/", getAttractions)
router.get("/:id", getAttractionById)

//super admin routes
router.post(
    "/",
    authenticate,
    authorizeRole("SUPER_ADMIN"),
    createAttraction
)

router.patch(
    "/:id",
    authenticate,
    authorizeRole("SUPER_ADMIN"),
    updateAttractionController,
)

router.delete(
    "/:id",
    authenticate,
    authorizeRole("SUPER_ADMIN"),
    deleteAttractionController,
)

export default router