-- DropForeignKey
ALTER TABLE "TagsOnWords" DROP CONSTRAINT "TagsOnWords_tagId_fkey";

-- DropForeignKey
ALTER TABLE "TagsOnWords" DROP CONSTRAINT "TagsOnWords_wordId_fkey";

-- AddForeignKey
ALTER TABLE "TagsOnWords" ADD CONSTRAINT "TagsOnWords_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnWords" ADD CONSTRAINT "TagsOnWords_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
