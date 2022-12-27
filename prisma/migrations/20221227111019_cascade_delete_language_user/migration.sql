-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_languageId_fkey";

-- DropForeignKey
ALTER TABLE "Language" DROP CONSTRAINT "Language_userId_fkey";

-- DropForeignKey
ALTER TABLE "LookupSource" DROP CONSTRAINT "LookupSource_userId_fkey";

-- DropForeignKey
ALTER TABLE "LookupSource" DROP CONSTRAINT "LookupSource_userId_languageId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_userId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_userId_languageId_fkey";

-- DropForeignKey
ALTER TABLE "Word" DROP CONSTRAINT "Word_userId_fkey";

-- DropForeignKey
ALTER TABLE "Word" DROP CONSTRAINT "Word_userId_languageId_fkey";

-- AddForeignKey
ALTER TABLE "LookupSource" ADD CONSTRAINT "LookupSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LookupSource" ADD CONSTRAINT "LookupSource_userId_languageId_fkey" FOREIGN KEY ("userId", "languageId") REFERENCES "Language"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_languageId_fkey" FOREIGN KEY ("userId", "languageId") REFERENCES "Language"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_userId_languageId_fkey" FOREIGN KEY ("userId", "languageId") REFERENCES "Language"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_languageId_fkey" FOREIGN KEY ("userId", "languageId") REFERENCES "Language"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
