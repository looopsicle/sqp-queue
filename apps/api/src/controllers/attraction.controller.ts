import type { Request, Response } from "express"
import { 
    listAttractions, 
    findAttractionById, 
    createAttraction as createAttractionService, 
    AttractionParentNotFoundError, 
} from "../services/attraction.service.js"

const UUID_REGEX =
/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// GET /api/attractions
export async function getAttractions(req: Request, res: Response) {
    try {
        const { parentId, category } = req.query;

        if (
            (parentId !== undefined && typeof parentId !== "string") ||
            (category !== undefined && typeof category !== "string")
        ) {
            return res.status(400).json({
                message: "Invalid query parameters.",
            })
        }

        if (parentId && !UUID_REGEX.test(parentId)) {
            return res.status(400).json({
                message: "parentId must be a valid UUID.",
            })
        }

        const normalizedCategory =
            typeof category === "string" ? category.trim() : ""

        if (category !== undefined && !normalizedCategory) {
            return res.status(400).json({
                message: "category cannot be empty.",
            })
        }

        const attractions = await listAttractions({
            ...(parentId ? { parentId } : {}),
            ...(normalizedCategory ? { category: normalizedCategory } : {}),
        })

        return res.status(200).json({
            message: "Attractions retrieved successfully.",
            data: attractions,
        })
    } catch (error) {
        console.error("Get attractions error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        })
    }
}

// GET /api/attractions/:id
export async function getAttractionById(req: Request, res: Response) {
    try {
        const id = req.params.id;

        if (typeof id !== "string" || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                message: "Attraction ID must be a valid UUID.",
            })
        }

        const attraction = await findAttractionById(id)

        if (!attraction) {
            return res.status(404).json({
                message: "Attraction not found.",
            })
        }

        return res.status(200).json({
            message: "Attraction retrieved successfully.",
            data: attraction,
        })
    } catch (error) {
        console.error("Get attraction by ID error:", error)

        return res.status(500).json({
        message: "Internal server error.",
        })
    }
}


// POST /api/attractions
export async function createAttraction(req: Request, res: Response) {
    try {
        const body = req.body ?? {}

        const { name, category, parentAttractionId } = body

        // Validate name
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required and must be a non-empty string.",
            })
        }

        // Validate category
        if (typeof category !== "string" || !category.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category is required and must be a non-empty string.",
            })
        }

        // Validate parentAttractionId
        if (
            parentAttractionId !== undefined &&
            parentAttractionId !== null &&
            (
                typeof parentAttractionId !== "string" ||
                !UUID_REGEX.test(parentAttractionId)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "parentAttractionId must be a valid UUID or null.",
            })
        }

        const attraction = await createAttractionService({
            name: name.trim(),
            category: category.trim(),
            parentAttractionId: parentAttractionId ?? null,
        })

        return res.status(201).json({
            success: true,
            message: "Attraction created successfully.",
            data: attraction,
        })

    } catch (error) {
        if (error instanceof AttractionParentNotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message,
            })
        }

        console.error("Create attraction error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        })
    }
}