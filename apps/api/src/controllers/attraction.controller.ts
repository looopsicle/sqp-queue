import type { NextFunction, Request, Response } from "express"
import { 
    listAttractions, 
    findAttractionById, 
    createAttraction as createAttractionService, 
    updateAttraction,
    deleteAttraction,
    AttractionParentNotFoundError,
    AttractionNotFoundError,
    AttractionHasDependenciesError,
    InvalidAttractionHierarchyError,
} from "../services/attraction.service.js"

const UUID_REGEX =
/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isPrismaForeignKeyError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2003"
    )
}

// GET /api/attractions
export async function getAttractions(req: Request, res: Response) {
    try {
        const { parentId, category } = req.query

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
        console.error("Get attractions error:", error)

        return res.status(500).json({
            message: "Internal server error.",
        })
    }
}

// GET /api/attractions/:id
export async function getAttractionById(req: Request, res: Response) {
    try {
        const id = req.params.id

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

// PATCH /api/attractions/:id
export async function updateAttractionController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { id } = req.params

        if (typeof id !== "string" || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_ATTRACTION_ID",
                message: "Attraction ID must be a valid UUID.",
            })
        }

        const { name, category, parentAttractionId } = req.body

        const data: {
            name?: string;
            category?: string;
            parentAttractionId?: string | null;
        } = {}

        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_ATTRACTION_NAME",
                    message: "Attraction name cannot be empty.",
                })
            }

            data.name = name.trim()
        }

        if (category !== undefined) {
            if (
                typeof category !== "string" ||
                category.trim().length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_ATTRACTION_CATEGORY",
                    message: "Attraction category cannot be empty.",
                })
            }

            data.category = category.trim()
        }

        if (parentAttractionId !== undefined) {
            if (
                parentAttractionId !== null &&
                (
                    typeof parentAttractionId !== "string" ||
                    !UUID_REGEX.test(parentAttractionId)
                )
            ) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_PARENT_ATTRACTION_ID",
                    message:
                        "Parent attraction ID must be a valid UUID or null.",
                })
            }

            data.parentAttractionId = parentAttractionId
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                code: "EMPTY_UPDATE",
                message: "At least one field must be provided.",
            })
        }

        const attraction = await updateAttraction(id, data)

        return res.status(200).json({
            success: true,
            message: "Attraction updated successfully.",
            data: attraction,
        })
    } catch (error) {
        if (error instanceof AttractionNotFoundError) {
            return res.status(404).json({
                success: false,
                code: "ATTRACTION_NOT_FOUND",
                message: error.message,
            })
        }

        if (error instanceof AttractionParentNotFoundError) {
            return res.status(404).json({
                success: false,
                code: "PARENT_ATTRACTION_NOT_FOUND",
                message: error.message,
            })
        }

        if (error instanceof InvalidAttractionHierarchyError) {
            return res.status(400).json({
                success: false,
                code: "INVALID_ATTRACTION_HIERARCHY",
                message: error.message,
            })
        }

        next(error)
    }
}

// DELETE /api/attractions/:id
export async function deleteAttractionController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { id } = req.params;

        if (typeof id !== "string" || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_ATTRACTION_ID",
                message: "Attraction ID must be a valid UUID.",
            })
        }

        const attraction = await deleteAttraction(id);

        return res.status(200).json({
            success: true,
            message: "Attraction deleted successfully.",
            data: attraction,
        })
    } catch (error) {
        if (error instanceof AttractionNotFoundError) {
            return res.status(404).json({
                success: false,
                code: "ATTRACTION_NOT_FOUND",
                message: error.message,
            })
        }

        if (error instanceof AttractionHasDependenciesError) {
            return res.status(409).json({
                success: false,
                code: "ATTRACTION_HAS_DEPENDENCIES",
                message: error.message,
            })
        }

        if (isPrismaForeignKeyError(error)) {
            return res.status(409).json({
                success: false,
                code: "ATTRACTION_HAS_DEPENDENCIES",
                message:
                    "Attraction cannot be deleted because it is referenced by other records.",
            })
        }

        next(error)
    }
}