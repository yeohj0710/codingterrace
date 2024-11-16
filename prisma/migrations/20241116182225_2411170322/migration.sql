/*
  Warnings:

  - A unique constraint covering the columns `[endpoint,type,postId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Subscription_endpoint_type_key";

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_endpoint_type_postId_key" ON "Subscription"("endpoint", "type", "postId");
