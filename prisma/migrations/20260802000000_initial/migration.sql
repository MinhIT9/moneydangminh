-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(30) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `displayName` VARCHAR(100) NOT NULL DEFAULT '',
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `is_locked` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifiedAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_seen_at` DATETIME(3) NULL,
    `user_agent` VARCHAR(512) NULL,
    `ip_address` VARCHAR(45) NULL,

    UNIQUE INDEX `sessions_token_hash_key`(`token_hash`),
    INDEX `sessions_user_id_expires_at_idx`(`user_id`, `expires_at`),
    INDEX `sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `icon` VARCHAR(64) NULL,
    `color` VARCHAR(16) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_archived` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `categories_user_id_type_is_archived_sort_order_idx`(`user_id`, `type`, `is_archived`, `sort_order`),
    UNIQUE INDEX `categories_user_id_name_type_key`(`user_id`, `name`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('CASH', 'BANK', 'EWALLET', 'CARD', 'OTHER') NOT NULL DEFAULT 'CASH',
    `icon` VARCHAR(64) NULL,
    `color` VARCHAR(16) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_archived` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payment_methods_user_id_is_archived_sort_order_idx`(`user_id`, `is_archived`, `sort_order`),
    UNIQUE INDEX `payment_methods_user_id_name_key`(`user_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `category_id` VARCHAR(30) NULL,
    `payment_method_id` VARCHAR(30) NULL,
    `debt_id` VARCHAR(30) NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `amount` DECIMAL(15, 0) NOT NULL,
    `note` TEXT NULL,
    `occurred_on` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `transactions_user_id_occurred_on_idx`(`user_id`, `occurred_on`),
    INDEX `transactions_user_id_type_occurred_on_idx`(`user_id`, `type`, `occurred_on`),
    INDEX `transactions_user_id_category_id_idx`(`user_id`, `category_id`),
    INDEX `transactions_user_id_payment_method_id_idx`(`user_id`, `payment_method_id`),
    INDEX `transactions_debt_id_idx`(`debt_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debts` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `counterparty` VARCHAR(150) NOT NULL,
    `direction` ENUM('I_OWE', 'OWED_TO_ME') NOT NULL,
    `original_amount` DECIMAL(15, 0) NOT NULL,
    `status` ENUM('ACTIVE', 'SETTLED') NOT NULL DEFAULT 'ACTIVE',
    `note` TEXT NULL,
    `started_on` DATE NOT NULL,
    `due_on` DATE NULL,
    `settled_on` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `debts_user_id_status_due_on_idx`(`user_id`, `status`, `due_on`),
    INDEX `debts_user_id_direction_status_idx`(`user_id`, `direction`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debt_payments` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `debt_id` VARCHAR(30) NOT NULL,
    `transaction_id` VARCHAR(30) NULL,
    `amount` DECIMAL(15, 0) NOT NULL,
    `paid_on` DATE NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `debt_payments_transaction_id_key`(`transaction_id`),
    INDEX `debt_payments_user_id_paid_on_idx`(`user_id`, `paid_on`),
    INDEX `debt_payments_debt_id_paid_on_idx`(`debt_id`, `paid_on`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_debt_id_fkey` FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debts` ADD CONSTRAINT `debts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debt_payments` ADD CONSTRAINT `debt_payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debt_payments` ADD CONSTRAINT `debt_payments_debt_id_fkey` FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debt_payments` ADD CONSTRAINT `debt_payments_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
