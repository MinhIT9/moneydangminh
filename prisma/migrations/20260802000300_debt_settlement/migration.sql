-- Distinguish an ordinary debt payment from the final settlement payment.
-- The actual paid amount stays unchanged even when an early settlement is
-- lower than the remaining contractual balance.
ALTER TABLE `debt_payments`
    ADD COLUMN `is_settlement` BOOLEAN NOT NULL DEFAULT false AFTER `amount`;
