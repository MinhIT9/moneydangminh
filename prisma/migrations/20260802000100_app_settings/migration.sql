-- Settings are intentionally stored as key/value pairs so future application-wide settings
-- can be added without a schema migration for each boolean or text preference.
CREATE TABLE `app_settings` (
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
