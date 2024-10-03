-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postIdx_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userIdx_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_userIdx_fkey";

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "User"("idx") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "User"("idx") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postIdx_fkey" FOREIGN KEY ("postIdx") REFERENCES "Post"("idx") ON DELETE CASCADE ON UPDATE CASCADE;
