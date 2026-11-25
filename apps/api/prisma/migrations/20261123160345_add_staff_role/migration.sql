-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('SUPER_ADMIN', 'STAFF');

-- AlterTable
ALTER TABLE "staff_profile" ADD COLUMN     "role" "staff_role" NOT NULL DEFAULT 'STAFF';
