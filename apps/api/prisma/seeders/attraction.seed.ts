
import { prisma } from "../../src/lib/prisma.js"

export async function seedAttractions() {
    console.log("Seeding attractions...")

    // Parent attraction
    const adventureRopes = await prisma.attraction.upsert({
        where: {
            id: "11111111-1111-4111-8111-111111111111",
        },
        update: {
            name: "Adventure Ropes",
            category: "Adventure",
            parentAttractionId: null,
        },
        create: {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Adventure Ropes",
            category: "Adventure",
        },
    })

    // Main attractions
    await prisma.attraction.upsert({
        where: {
            id: "22222222-2222-4222-8222-222222222222",
        },
        update: {
            name: "Mini Train",
            category: "Ride",
            parentAttractionId: null,
        },
        create: {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Mini Train",
            category: "Ride",
        },
    })

    await prisma.attraction.upsert({
        where: {
            id: "33333333-3333-4333-8333-333333333333",
        },
        update: {
            name: "Wall Climbing",
            category: "Adventure",
            parentAttractionId: null,
        },
        create: {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Wall Climbing",
            category: "Adventure",
        },
    })

    // Child attractions
    await prisma.attraction.upsert({
        where: {
            id: "44444444-4444-4444-8444-444444444444",
        },
        update: {
            name: "Kiddy Ropes",
            category: "Adventure",
            parentAttractionId: adventureRopes.id,
        },
        create: {
            id: "44444444-4444-4444-8444-444444444444",
            name: "Kiddy Ropes",
            category: "Adventure",
            parentAttractionId: adventureRopes.id,
        },
    })

    await prisma.attraction.upsert({
        where: {
            id: "55555555-5555-4555-8555-555555555555",
        },
        update: {
            name: "Rope Course",
            category: "Adventure",
            parentAttractionId: adventureRopes.id,
        },
        create: {
            id: "55555555-5555-4555-8555-555555555555",
            name: "Rope Course",
            category: "Adventure",
            parentAttractionId: adventureRopes.id,
        },
    })

    console.log("Attractions seeded successfully.")
}
