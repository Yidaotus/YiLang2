-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "documentId" TEXT,
ADD COLUMN     "spelling" TEXT;

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wordId" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
