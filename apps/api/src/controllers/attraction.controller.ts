import type { Request, Response } from "express"
import { listAttractions, findAttractionById } from "../services/attraction.service.js"

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
