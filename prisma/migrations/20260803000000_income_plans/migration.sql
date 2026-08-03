-- Store only each user's planning inputs. Daily, weekly, and monthly targets
-- remain derived values so they always reflect the latest ledger and debts.
CREATE TABLE `income_plans` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `month` DATE NOT NULL,
    `target_surplus` DECIMAL(15, 0) NOT NULL DEFAULT 0,
    `workdays_per_week` INTEGER NOT NULL DEFAULT 6,
    `extra_expected_expense` DECIMAL(15, 0) NOT NULL DEFAULT 0,
    `include_due_debts` BOOLEAN NOT NULL DEFAULT true,
    `forecast_method` ENUM('CURRENT_PACE', 'THREE_MONTH_AVERAGE', 'MANUAL') NOT NULL DEFAULT 'CURRENT_PACE',
    `manual_monthly_expense` DECIMAL(15, 0) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `income_plans_user_id_month_idx`(`user_id`, `month`),
    UNIQUE INDEX `income_plans_user_id_month_key`(`user_id`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `income_plans`
    ADD CONSTRAINT `income_plans_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
