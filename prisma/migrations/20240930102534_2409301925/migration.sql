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

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "User"("idx") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postIdx_fkey" FOREIGN KEY ("postIdx") REFERENCES "Post"("idx") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentIdx_fkey" FOREIGN KEY ("parentIdx") REFERENCES "Comment"("idx") ON DELETE SET NULL ON UPDATE CASCADE;
