-- AlterTable
ALTER TABLE "plans"
ADD COLUMN "focus" TEXT NOT NULL DEFAULT 'full_body',
ADD COLUMN "is_custom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "owner_id" TEXT;

-- AlterTable
ALTER TABLE "workout_sessions"
ADD COLUMN "plan_day" INTEGER;

-- CreateIndex
CREATE INDEX "plans_focus_idx" ON "plans"("focus");

-- CreateIndex
CREATE INDEX "plans_owner_id_idx" ON "plans"("owner_id");

-- AddForeignKey
ALTER TABLE "plans"
ADD CONSTRAINT "plans_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
