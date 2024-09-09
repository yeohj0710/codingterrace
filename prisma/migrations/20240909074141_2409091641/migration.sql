-- CreateTable
CREATE TABLE "Post" (
    "idx" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userIdx" INTEGER NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "Image" (
    "idx" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postIdx" INTEGER NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("idx")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "User"("idx") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_postIdx_fkey" FOREIGN KEY ("postIdx") REFERENCES "Post"("idx") ON DELETE RESTRICT ON UPDATE CASCADE;
