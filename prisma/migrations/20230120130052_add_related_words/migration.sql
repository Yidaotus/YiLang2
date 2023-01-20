-- CreateTable
CREATE TABLE "_WordRelatedTo" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_WordRelatedTo_AB_unique" ON "_WordRelatedTo"("A", "B");

-- CreateIndex
CREATE INDEX "_WordRelatedTo_B_index" ON "_WordRelatedTo"("B");

-- AddForeignKey
ALTER TABLE "_WordRelatedTo" ADD CONSTRAINT "_WordRelatedTo_A_fkey" FOREIGN KEY ("A") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WordRelatedTo" ADD CONSTRAINT "_WordRelatedTo_B_fkey" FOREIGN KEY ("B") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
