-- AlterTable
ALTER TABLE `carlisting` MODIFY `type` VARCHAR(191) NULL,
    MODIFY `make` VARCHAR(191) NULL,
    MODIFY `model` VARCHAR(191) NULL,
    MODIFY `price` DECIMAL(10, 2) NULL,
    MODIFY `year` INTEGER NULL;
