-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "rootId" TEXT;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;
