-- Os perfis STAFF deixam de existir (o administrador faz tudo o necessário).
DELETE FROM "UserRole" WHERE "role" = 'STAFF';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "UserRole" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "StaffAssignment" DROP CONSTRAINT "StaffAssignment_dropOffPointId_fkey";

-- DropForeignKey
ALTER TABLE "StaffAssignment" DROP CONSTRAINT "StaffAssignment_userId_fkey";

-- DropTable
DROP TABLE "StaffAssignment";

