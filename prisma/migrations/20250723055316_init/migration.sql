-- CreateTable
CREATE TABLE `CarListing` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `condition` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `make` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `year` INTEGER NOT NULL,
    `driveType` VARCHAR(191) NULL,
    `transmission` VARCHAR(191) NULL,
    `fuelType` VARCHAR(191) NULL,
    `mileage` INTEGER NULL,
    `engineSize` DOUBLE NULL,
    `cylinders` INTEGER NULL,
    `color` VARCHAR(191) NULL,
    `doors` INTEGER NULL,
    `vin` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `videoLink` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryImage` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `carListingId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CarAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `carListingId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CarFeature` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `carListingId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CarSafetyFeature` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `carListingId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GalleryImage` ADD CONSTRAINT `GalleryImage_carListingId_fkey` FOREIGN KEY (`carListingId`) REFERENCES `CarListing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarAttachment` ADD CONSTRAINT `CarAttachment_carListingId_fkey` FOREIGN KEY (`carListingId`) REFERENCES `CarListing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarFeature` ADD CONSTRAINT `CarFeature_carListingId_fkey` FOREIGN KEY (`carListingId`) REFERENCES `CarListing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarSafetyFeature` ADD CONSTRAINT `CarSafetyFeature_carListingId_fkey` FOREIGN KEY (`carListingId`) REFERENCES `CarListing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
