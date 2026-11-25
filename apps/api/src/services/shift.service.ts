
import { prisma } from "../lib/prisma.js"
import type { Prisma } from "../generated/prisma/client.js"

// =========================
// Custom errors
// =========================

export class ShiftNotFoundError extends Error {
    constructor() {
        super("Shift was not found.")
        this.name = "ShiftNotFoundError"
    }
}

export class StaffNotFoundError extends Error {
    constructor() {
        super("Staff profile was not found.")
        this.name = "StaffNotFoundError"
    }
}

export class InactiveStaffError extends Error {
    constructor() {
        super("Inactive staff cannot be assigned to a shift.")
        this.name = "InactiveStaffError"
    }
}

export class ShiftAssignmentNotFoundError extends Error {
    constructor() {
        super("Shift assignment was not found.")
        this.name = "ShiftAssignmentNotFoundError"
    }
}

export class ShiftOverlapError extends Error {
    constructor() {
        super("Staff already has another shift during this time.")
        this.name = "ShiftOverlapError"
    }
}

export class ShiftHasAssignmentsError extends Error {
    constructor() {
        super("Cannot delete a shift that still has staff assignments.")
        this.name = "ShiftHasAssignmentsError"
    }
}

export class ShiftAssignmentHasLogsError extends Error {
    constructor() {
        super("Cannot remove an assignment that has operational logs.")
        this.name = "ShiftAssignmentHasLogsError"
    }
}

export class InvalidShiftTimeError extends Error {
    constructor() {
        super("Shift start time must be earlier than shift end time.")
        this.name = "InvalidShiftTimeError"
    }
}

// =========================
// Helpers
// =========================

function validateShiftTime(startedAt: Date, endedAt: Date) {
    if (
        !Number.isFinite(startedAt.getTime()) ||
        !Number.isFinite(endedAt.getTime()) ||
        startedAt >= endedAt
    ) {
        throw new InvalidShiftTimeError()
    }
}

/**
 * Mengunci baris StaffShift agar perubahan jadwal dan
 * perubahan assignment pada shift yang sama tidak saling
 * mendahului.
 */
async function lockShift(
    tx: Prisma.TransactionClient,
    shiftId: string,
) {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM staff_shift
        WHERE id = ${shiftId}::uuid
        FOR UPDATE
    `

    if (rows.length === 0) {
        throw new ShiftNotFoundError()
    }
}

/**
 * Mengunci baris StaffProfile.
 *
 * Lock ini penting untuk mencegah dua request bersamaan
 * menugaskan staf yang sama ke dua shift yang bertabrakan.
 */
async function lockStaffProfile(
    tx: Prisma.TransactionClient,
    staffProfileId: string,
) {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM staff_profile
        WHERE id = ${staffProfileId}::uuid
        FOR UPDATE
    `

    if (rows.length === 0) {
        throw new StaffNotFoundError()
    }
}

// =========================
// Read operations
// =========================

export async function listShifts() {
    return prisma.staffShift.findMany({
        orderBy: {
            startedAt: "desc",
        },
        include: {
            assignments: {
                orderBy: {
                    staffProfile: {
                        employeeCode: "asc",
                    },
                },
                include: {
                    staffProfile: {
                        select: {
                            id: true,
                            employeeCode: true,
                            role: true,
                            isActive: true,
                            user: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })
}

export async function findShiftById(id: string) {
    const shift = await prisma.staffShift.findUnique({
        where: { id },
        include: {
            assignments: {
                orderBy: {
                    staffProfile: {
                        employeeCode: "asc",
                    },
                },
                include: {
                    staffProfile: {
                        select: {
                            id: true,
                            employeeCode: true,
                            role: true,
                            isActive: true,
                            user: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!shift) {
        throw new ShiftNotFoundError()
    }

    return shift
}

// =========================
// Create shift
// =========================

export async function createShift(data: {
    startedAt: Date
    endedAt: Date
}) {
    validateShiftTime(data.startedAt, data.endedAt);

    return prisma.staffShift.create({
        data: {
            startedAt: data.startedAt,
            endedAt: data.endedAt,
        },
    })
}

// =========================
// Update shift
// =========================

export async function updateShift(
    id: string,
    data: {
        startedAt?: Date
        endedAt?: Date
    },
) {
    return prisma.$transaction(async (tx) => {
        // Lock shift terlebih dahulu agar assignment baru
        // tidak masuk ketika jadwal sedang diubah.
        await lockShift(tx, id)

        const currentShift = await tx.staffShift.findUnique({
            where: { id },
            include: {
                assignments: {
                    select: {
                        staffProfileId: true,
                    },
                },
            },
        })

        if (!currentShift) {
            throw new ShiftNotFoundError()
        }

        const nextStartedAt = data.startedAt ?? currentShift.startedAt
        const nextEndedAt = data.endedAt ?? currentShift.endedAt

        validateShiftTime(nextStartedAt, nextEndedAt)

        // Lock semua staf yang ditugaskan, urut berdasarkan ID
        // untuk mengurangi risiko deadlock.
        const staffProfileIds = [
            ...new Set(
                currentShift.assignments.map(
                    (assignment) => assignment.staffProfileId,
                ),
            ),
        ].sort()

        for (const staffProfileId of staffProfileIds) {
            await lockStaffProfile(tx, staffProfileId)
        }

        // Periksa apakah jadwal baru bertabrakan dengan shift lain
        // milik salah satu staf yang sudah ditugaskan.
        for (const staffProfileId of staffProfileIds) {
            const overlappingAssignment =
                await tx.shiftAssignment.findFirst({
                    where: {
                        staffProfileId,
                        shiftId: {
                            not: id,
                        },
                        shift: {
                            startedAt: {
                                lt: nextEndedAt,
                            },
                            endedAt: {
                                gt: nextStartedAt,
                            },
                        },
                    },
                    select: {
                        id: true,
                    },
                })

            if (overlappingAssignment) {
                throw new ShiftOverlapError()
            }
        }

        return tx.staffShift.update({
            where: { id },
            data: {
                startedAt: nextStartedAt,
                endedAt: nextEndedAt,
            },
        })
    })
}

// =========================
// Delete shift
// =========================

export async function deleteShift(id: string) {
    return prisma.$transaction(async (tx) => {
        await lockShift(tx, id);

        const assignmentCount = await tx.shiftAssignment.count({
            where: { shiftId: id },
        })

        if (assignmentCount > 0) {
            throw new ShiftHasAssignmentsError()
        }

        return tx.staffShift.delete({
            where: { id },
        })
    })
}

// =========================
// Assign staff to shift
// =========================

export async function assignStaffToShift(
    shiftId: string,
    staffProfileId: string,
) {
    return prisma.$transaction(async (tx) => {
        // Urutan lock harus konsisten: shift dahulu, kemudian staf.
        await lockShift(tx, shiftId);
        await lockStaffProfile(tx, staffProfileId);

        const staffProfile = await tx.staffProfile.findUnique({
            where: {
                id: staffProfileId,
            },
            select: {
                id: true,
                isActive: true,
            },
        })

        if (!staffProfile) {
            throw new StaffNotFoundError()
        }

        if (!staffProfile.isActive) {
            throw new InactiveStaffError()
        }

        const targetShift = await tx.staffShift.findUnique({
            where: {
                id: shiftId,
            },
            select: {
                startedAt: true,
                endedAt: true,
            },
        })

        if (!targetShift) {
            throw new ShiftNotFoundError()
        }

        // Half-open interval:
        // shift A berakhir pukul 16:00 dan shift B mulai 16:00
        // diperbolehkan karena keduanya tidak overlap.
        const overlappingAssignment =
            await tx.shiftAssignment.findFirst({
                where: {
                    staffProfileId,
                    shift: {
                        startedAt: {
                            lt: targetShift.endedAt,
                        },
                        endedAt: {
                            gt: targetShift.startedAt,
                        },
                    },
                },
                select: {
                    id: true,
                },
            })

        if (overlappingAssignment) {
            throw new ShiftOverlapError()
        }

        return tx.shiftAssignment.create({
            data: {
                shiftId,
                staffProfileId,
            },
            include: {
                staffProfile: {
                    select: {
                        id: true,
                        employeeCode: true,
                        role: true,
                        isActive: true,
                        user: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        })
    })
}

// =========================
// Remove staff assignment
// =========================

export async function removeStaffFromShift(
    shiftId: string,
    staffProfileId: string,
) {
    return prisma.$transaction(async (tx) => {
        await lockShift(tx, shiftId)
        await lockStaffProfile(tx, staffProfileId)

        const assignment = await tx.shiftAssignment.findUnique({
            where: {
                shiftId_staffProfileId: {
                    shiftId,
                    staffProfileId,
                },
            },
            select: {
                id: true,
                _count: {
                    select: {
                        operationLogs: true,
                    },
                },
            },
        })

        if (!assignment) {
            throw new ShiftAssignmentNotFoundError()
        }

        if (assignment._count.operationLogs > 0) {
            throw new ShiftAssignmentHasLogsError()
        }

        return tx.shiftAssignment.delete({
            where: {
                id: assignment.id,
            },
        })
    })
}
