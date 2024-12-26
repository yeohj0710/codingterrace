/*
  Warnings:

  - You are about to drop the `Category_` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product_` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentIdx_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postIdx_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userIdx_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_userIdx_fkey";

-- DropForeignKey
ALTER TABLE "Product_" DROP CONSTRAINT "Product__categoryId_fkey";

-- DropTable
DROP TABLE "Category_";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Product_";

-- DropTable
DROP TABLE "Subscription";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "category_" (
    "idx" SERIAL NOT NULL,
    "name" TEXT,
    "image" TEXT,

    CONSTRAINT "category__pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "product_" (
    "idx" SERIAL NOT NULL,
    "name" TEXT,
    "images" TEXT[],
    "description" TEXT,
    "price" INTEGER,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "product__pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "comment" (
    "idx" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "nickname" TEXT,
    "ip" TEXT,
    "password" TEXT,
    "userIdx" INTEGER,
    "postIdx" INTEGER NOT NULL,
    "parentIdx" INTEGER,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "post" (
    "idx" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userIdx" INTEGER,
    "ip" TEXT,
    "nickname" TEXT,

    CONSTRAINT "post_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "postId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "commentId" INTEGER,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "idx" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("idx")
);

-- CreateIndex
CREATE UNIQUE INDEX "category__name_key" ON "category_"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_endpoint_type_postId_commentId_key" ON "subscription"("endpoint", "type", "postId", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_nickname_key" ON "user"("nickname");

-- AddForeignKey
ALTER TABLE "product_" ADD CONSTRAINT "product__categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category_"("idx") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_parentIdx_fkey" FOREIGN KEY ("parentIdx") REFERENCES "comment"("idx") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_postIdx_fkey" FOREIGN KEY ("postIdx") REFERENCES "post"("idx") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "user"("idx") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "user"("idx") ON DELETE CASCADE ON UPDATE CASCADE;
