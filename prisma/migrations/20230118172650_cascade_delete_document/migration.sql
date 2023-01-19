-- DropForeignKey
ALTER TABLE "GrammarPoint" DROP CONSTRAINT "GrammarPoint_documentId_fkey";

-- DropForeignKey
ALTER TABLE "Sentence" DROP CONSTRAINT "Sentence_documentId_fkey";

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarPoint" ADD CONSTRAINT "GrammarPoint_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
