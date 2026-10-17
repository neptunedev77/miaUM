-- AlterEnum
BEGIN;
CREATE TYPE "HolderType_new" AS ENUM ('POINT', 'FINDER');
ALTER TABLE "Report" ALTER COLUMN "holderType" TYPE "HolderType_new" USING ("holderType"::text::"HolderType_new");
ALTER TABLE "AnonymousOutcome" ALTER COLUMN "holderType" TYPE "HolderType_new" USING ("holderType"::text::"HolderType_new");
ALTER TYPE "HolderType" RENAME TO "HolderType_old";
ALTER TYPE "HolderType_new" RENAME TO "HolderType";
DROP TYPE "public"."HolderType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_spotLocationId_fkey";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "spotLocationId",
DROP COLUMN "spotNote",
DROP COLUMN "spotType",
ADD COLUMN     "dropOffText" VARCHAR(120),
ADD COLUMN     "finderContact" VARCHAR(120);

