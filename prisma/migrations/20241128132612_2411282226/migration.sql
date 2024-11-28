/*
  Warnings:

  - A unique constraint covering the columns `[endpoint,type,postId,commentId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Subscription_endpoint_type_postId_key";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "commentId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_endpoint_type_postId_commentId_key" ON "Subscription"("endpoint", "type", "postId", "commentId");
