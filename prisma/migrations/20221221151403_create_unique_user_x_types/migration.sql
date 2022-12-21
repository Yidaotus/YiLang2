/*
  Warnings:

  - A unique constraint covering the columns `[userId,id]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,id]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,id]` on the table `Word` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Document_userId_id_key" ON "Document"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_id_key" ON "Tag"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Word_userId_id_key" ON "Word"("userId", "id");
