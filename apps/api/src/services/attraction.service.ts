
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
        super("Parent attraction not found.");
        this.name = "AttractionParentNotFoundError";
    }
}

export async function createAttraction(data: {
    name: string;
    category: string;
    parentAttractionId?: string | null;
}) {
    const { name, category, parentAttractionId } = data;

    // Pastikan parent attraction tersedia jika parentId diberikan
    if (parentAttractionId) {
        const parent = await prisma.attraction.findUnique({
            where: { id: parentAttractionId },
            select: { id: true },
        })

        if (!parent) {
            throw new AttractionParentNotFoundError();
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
