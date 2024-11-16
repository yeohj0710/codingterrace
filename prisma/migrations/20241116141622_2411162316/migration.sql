/*
  Warnings:

  - You are about to drop the column `created_at` on the `Subscription` table. All the data in the column will be lost.
  - Made the column `type` on table `Subscription` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Subscription_endpoint_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "created_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "postId" INTEGER,
ALTER COLUMN "type" SET NOT NULL;
