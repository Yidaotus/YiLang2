/*
  Warnings:

  - The primary key for the `Language` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_languageId_fkey";

-- DropForeignKey
ALTER TABLE "LookupSource" DROP CONSTRAINT "LookupSource_languageId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_languageId_fkey";

-- DropForeignKey
ALTER TABLE "Word" DROP CONSTRAINT "Word_languageId_fkey";

-- DropIndex
DROP INDEX "Language_userId_id_key";

-- AlterTable
ALTER TABLE "Language" DROP CONSTRAINT "Language_pkey",
ADD CONSTRAINT "Language_pkey" PRIMARY KEY ("userId", "id");

-- AddForeignKey
ALTER TABLE "LookupSource" ADD CONSTRAINT "LookupSource_userId_languageId_fkey" FOREIGN KEY ("userId", "languageId") REFERENCES "Language"("userId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_languageId_fkey" FOREIGN KEY ("userId", "languageId") REFERENCES "Language"("userId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_userId_languageId_fkey" FOREIGN KEY ("userId", "languageId") REFERENCES "Language"("userId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_languageId_fkey" FOREIGN KEY ("userId", "languageId") REFERENCES "Language"("userId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
