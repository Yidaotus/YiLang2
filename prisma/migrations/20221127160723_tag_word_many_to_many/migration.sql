/*
  Warnings:

  - You are about to drop the column `wordId` on the `Tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_wordId_fkey";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "wordId";

-- CreateTable
CREATE TABLE "TagsOnWords" (
    "tagId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagsOnWords_pkey" PRIMARY KEY ("tagId","wordId")
);

-- AddForeignKey
ALTER TABLE "TagsOnWords" ADD CONSTRAINT "TagsOnWords_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnWords" ADD CONSTRAINT "TagsOnWords_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
