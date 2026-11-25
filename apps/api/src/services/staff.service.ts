
import { prisma } from "../lib/prisma.js"
import type { StaffRole } from "../middlewares/staff-authorization.js"

export class StaffUserNotFoundError extends Error {
    constructor() {
        super("The specified user does not exist.")
        this.name = "StaffUserNotFoundError"
    }
}

export class StaffProfileNotFoundError extends Error {
    constructor() {
        super("Staff profile not found.")
        this.name = "StaffProfileNotFoundError"
    }
}

export class LastActiveSuperAdminError extends Error {
    constructor() {
        super("At least one active Super Admin must remain.")
        this.name = "LastActiveSuperAdminError"
    }
}

export async function listStaff() {
    return prisma.staffProfile.findMany({
        select: {
            id: true,
            userId: true,
            employeeCode: true,
            role: true,
            isActive: true,
            user: {
                select: {
                    id: true,
                    oauthAccounts: {
                        select: {
                            provider: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            employeeCode: "asc",
        },
    })
}

export async function findStaffById(id: string) {
    return prisma.staffProfile.findUnique({
        where: { id },
        select: {
            id: true,
            userId: true,
            employeeCode: true,
            role: true,
            isActive: true,
            user: {
                select: {
                    id: true,
                    oauthAccounts: {
                        select: {
                            provider: true,
                            email: true,
                        },
                    },
                },
            },
        },
    })
}

export async function createStaff(data: {
    userId: string
    employeeCode: string
    role?: StaffRole
}) {
    const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true },
    })

    if (!user) {
        throw new StaffUserNotFoundError()
    }

    return prisma.staffProfile.create({
        data: {
            userId: data.userId,
            employeeCode: data.employeeCode,
            role: data.role ?? "STAFF",
        },
        select: {
            id: true,
            userId: true,
            employeeCode: true,
            role: true,
            isActive: true,
        },
    })
}

export async function updateStaff(
    id: string,
    data: {
        employeeCode?: string
        role?: StaffRole
    },
) {
    return prisma.$transaction(async (tx) => {
        // Lock active Super Admin rows to prevent concurrent
        // changes from removing the last active Super Admin.
        const activeSuperAdmins = await tx.$queryRaw<
            Array<{ id: string }>
        >`
            SELECT id
            FROM staff_profile
            WHERE role = 'SUPER_ADMIN'
              AND is_active = TRUE
            FOR UPDATE
        `

        const staff = await tx.staffProfile.findUnique({
            where: { id },
        })

        if (!staff) {
            throw new StaffProfileNotFoundError()
        }

        const isDemotingLastSuperAdmin =
            staff.role === "SUPER_ADMIN" &&
            staff.isActive &&
            data.role === "STAFF";

        if (
            isDemotingLastSuperAdmin &&
            activeSuperAdmins.length <= 1
        ) {
            throw new LastActiveSuperAdminError()
        }

        return tx.staffProfile.update({
            where: { id },
            data,
            select: {
                id: true,
                userId: true,
                employeeCode: true,
                role: true,
                isActive: true,
            },
        })
    })
}

export async function deactivateStaff(id: string) {
    return prisma.$transaction(async (tx) => {
        // Serialize staff deactivation against other role changes.
        const activeSuperAdmins = await tx.$queryRaw<
            Array<{ id: string }>
        >`
            SELECT id
            FROM staff_profile
            WHERE role = 'SUPER_ADMIN'
              AND is_active = TRUE
            FOR UPDATE
        `

        const staff = await tx.staffProfile.findUnique({
            where: { id },
        })

        if (!staff) {
            throw new StaffProfileNotFoundError()
        }

        if (!staff.isActive) {
            return staff
        }

        const isDeactivatingSuperAdmin =
            staff.role === "SUPER_ADMIN"

        if (
            isDeactivatingSuperAdmin &&
            activeSuperAdmins.length <= 1
        ) {
            throw new LastActiveSuperAdminError()
        }

        return tx.staffProfile.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                userId: true,
                employeeCode: true,
                role: true,
                isActive: true,
            },
        })
    })
}
