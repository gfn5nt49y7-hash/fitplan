-- AlterTable
ALTER TABLE "exercises"
ADD COLUMN "movement_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
