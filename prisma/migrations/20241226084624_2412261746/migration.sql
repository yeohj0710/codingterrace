-- CreateTable
CREATE TABLE "Category_" (
    "idx" SERIAL NOT NULL,
    "name" TEXT,
    "image" TEXT,

    CONSTRAINT "Category__pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "Product_" (
    "idx" SERIAL NOT NULL,
    "name" TEXT,
    "images" TEXT[],
    "description" TEXT,
    "price" INTEGER,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Product__pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "Comment" (
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

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "Post" (
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

    CONSTRAINT "Post_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "Subscription" (
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

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "idx" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("idx")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category__name_key" ON "Category_"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_endpoint_type_postId_commentId_key" ON "Subscription"("endpoint", "type", "postId", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- AddForeignKey
ALTER TABLE "Product_" ADD CONSTRAINT "Product__categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category_"("idx") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentIdx_fkey" FOREIGN KEY ("parentIdx") REFERENCES "Comment"("idx") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postIdx_fkey" FOREIGN KEY ("postIdx") REFERENCES "Post"("idx") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "User"("idx") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "User"("idx") ON DELETE CASCADE ON UPDATE CASCADE;
