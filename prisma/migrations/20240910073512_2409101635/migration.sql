-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_userIdx_fkey";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "userIdx" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userIdx_fkey" FOREIGN KEY ("userIdx") REFERENCES "User"("idx") ON DELETE SET NULL ON UPDATE CASCADE;
