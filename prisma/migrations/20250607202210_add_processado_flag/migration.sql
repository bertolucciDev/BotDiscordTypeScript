/*
  Warnings:

  - Made the column `descricao` on table `Evento` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Evento` ADD COLUMN `processado` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `descricao` VARCHAR(191) NOT NULL;
