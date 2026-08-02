-- Keep the text a person entered for a transaction, while `amount` remains
-- the numeric total used by all dashboard and reporting queries.
-- Nullable expression columns preserve all records created before this feature.
ALTER TABLE `transactions`
    ADD COLUMN `amount_expression` VARCHAR(500) NULL,
    ADD COLUMN `tip_amount` DECIMAL(15, 0) NOT NULL DEFAULT 0,
    ADD COLUMN `tip_expression` VARCHAR(500) NULL;
