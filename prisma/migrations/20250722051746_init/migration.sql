/*
  Warnings:

  - You are about to drop the `carfeature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `carimage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `carkeyword` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cars` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inquiries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uploads` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `carfeature` DROP FOREIGN KEY `CarFeature_carId_fkey`;

-- DropForeignKey
ALTER TABLE `carimage` DROP FOREIGN KEY `CarImage_carId_fkey`;

-- DropForeignKey
ALTER TABLE `carkeyword` DROP FOREIGN KEY `CarKeyword_carId_fkey`;

-- DropForeignKey
ALTER TABLE `cars` DROP FOREIGN KEY `cars_createdBy_fkey`;

-- DropForeignKey
ALTER TABLE `cars` DROP FOREIGN KEY `cars_updatedBy_fkey`;

-- DropForeignKey
ALTER TABLE `inquiries` DROP FOREIGN KEY `inquiries_carId_fkey`;

-- DropTable
DROP TABLE `carfeature`;

-- DropTable
DROP TABLE `carimage`;

-- DropTable
DROP TABLE `carkeyword`;

-- DropTable
DROP TABLE `cars`;

-- DropTable
DROP TABLE `inquiries`;

-- DropTable
DROP TABLE `settings`;

-- DropTable
DROP TABLE `uploads`;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `UserTeam` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `Role` ENUM('CEO', 'MANAGING DIRECTOR') NOT NULL,
    `PNumber` INTEGER NOT NULL,

    UNIQUE INDEX `UserTeam_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
