
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
