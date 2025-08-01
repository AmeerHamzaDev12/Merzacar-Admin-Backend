/*
  Warnings:

  - You are about to drop the column `PNumber` on the `userteam` table. All the data in the column will be lost.
  - You are about to drop the column `Role` on the `userteam` table. All the data in the column will be lost.
  - Added the required column `phone` to the `UserTeam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `UserTeam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserTeam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `userteam` DROP COLUMN `PNumber`,
    DROP COLUMN `Role`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `phone` VARCHAR(191) NOT NULL,
    ADD COLUMN `role` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
