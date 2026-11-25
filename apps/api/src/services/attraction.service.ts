
import { prisma } from "../lib/prisma.js"

export async function listAttractions(filters: {
    parentId?: string
    category?: string
}) {
    const { parentId, category } = filters

    return prisma.attraction.findMany({
        where: {
        ...(parentId ? { parentAttractionId: parentId } : {}),
        ...(category
            ? {
                category: {
                equals: category,
                mode: "insensitive",
                },
            }
            : {}),
        },
        select: {
            id: true,
            name: true,
            category: true,
            parentAttractionId: true,
            parent: {
                select: {
                id: true,
                name: true,
                category: true,
                },
            },
            children: {
                select: {
                id: true,
                name: true,
                category: true,
                parentAttractionId: true,
                },
                orderBy: {
                name: "asc",
                },
            },
        },
        orderBy: {
        name: "asc",
        },
    })
}

export async function findAttractionById(id: string) {
    return prisma.attraction.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            category: true,
            parentAttractionId: true,
            parent: {
                select: {
                id: true,
                name: true,
                category: true,
                },
            },
            children: {
                select: {
                id: true,
                name: true,
                category: true,
                parentAttractionId: true,
                },
                orderBy: {
                name: "asc",
                },
            },
        },
    })
}


export class AttractionParentNotFoundError extends Error {
    constructor() {
        super("Parent attraction not found.")
        this.name = "AttractionParentNotFoundError"
    }
}

export class AttractionNotFoundError extends Error {
    constructor() {
        super("Attraction not found.")
        this.name = "AttractionNotFoundError"
    }
}

export class AttractionHasDependenciesError extends Error {
    constructor() {
        super(
            "Attraction cannot be deleted because it is referenced by other records.",
        )
        this.name = "AttractionHasDependenciesError"
    }
}

export class InvalidAttractionHierarchyError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "InvalidAttractionHierarchyError"
    }
}


export async function createAttraction(data: {
    name: string
    category: string
    parentAttractionId?: string | null
}) {
    const { name, category, parentAttractionId } = data

    // Pastikan parent attraction tersedia jika parentId diberikan
    if (parentAttractionId) {
        const parent = await prisma.attraction.findUnique({
            where: { id: parentAttractionId },
            select: { id: true },
        })

        if (!parent) {
            throw new AttractionParentNotFoundError()
        }
    }

    return prisma.attraction.create({
        data: {
            name,
            category,
            parentAttractionId: parentAttractionId ?? null,
        },
        select: {
            id: true,
            name: true,
            category: true,
            parentAttractionId: true,
        },
    })
}

// PATCH /api/attractions/:id
export async function updateAttraction(
    id: string,
    data: {
        name?: string
        category?: string
        parentAttractionId?: string | null
    },
) {
    return prisma.$transaction(async (tx) => {
        const attraction = await tx.attraction.findUnique({
            where: { id },
            select: {
                id: true,
                parentAttractionId: true,
            },
        })

        if (!attraction) {
            throw new AttractionNotFoundError();
        }

        if (data.parentAttractionId !== undefined) {
            if (data.parentAttractionId === id) {
                throw new InvalidAttractionHierarchyError(
                    "An attraction cannot be its own parent.",
                );
            }

            if (data.parentAttractionId !== null) {
                const parent = await tx.attraction.findUnique({
                    where: { id: data.parentAttractionId },
                    select: { id: true },
                })

                if (!parent) {
                    throw new AttractionParentNotFoundError()
                }

                // Walk up the proposed parent's ancestry.
                // If the current attraction is encountered,
                // assigning this parent would create a cycle.
                let currentParentId: string | null =
                    data.parentAttractionId;

                while (currentParentId !== null) {
                    if (currentParentId === id) {
                        throw new InvalidAttractionHierarchyError(
                            "This parent assignment would create a circular hierarchy.",
                        )
                    }

                    const currentParent: { parentAttractionId: string | null } | null =
                        await tx.attraction.findUnique({
                            where: { id: currentParentId },
                            select: { parentAttractionId: true },
                        })

                    currentParentId =
                        currentParent?.parentAttractionId ?? null
                }
            }
        }

        return tx.attraction.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                category: true,
                parentAttractionId: true,
            },
        })
    })
}

// DELETE /api/attractions/:id
export async function deleteAttraction(id: string) {
    return prisma.$transaction(async (tx) => {
        const attraction = await tx.attraction.findUnique({
            where: { id },
            select: { id: true },
        })

        if (!attraction) {
            throw new AttractionNotFoundError()
        }

        const [
            childCount,
            externalTicketCount,
            queuePassCount,
            queueSessionCount,
        ] = await Promise.all([
            tx.attraction.count({
                where: { parentAttractionId: id },
            }),
            tx.externalTicket.count({
                where: { attractionId: id },
            }),
            tx.queuePass.count({
                where: { attractionId: id },
            }),
            tx.queueSession.count({
                where: { attractionId: id },
            }),
        ])

        if (
            childCount > 0 ||
            externalTicketCount > 0 ||
            queuePassCount > 0 ||
            queueSessionCount > 0
        ) {
            throw new AttractionHasDependenciesError();
        }

        return tx.attraction.delete({
            where: { id },
            select: {
                id: true,
                name: true,
                category: true,
                parentAttractionId: true,
            },
        })
    })
}