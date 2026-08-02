-- AlterTable
ALTER TABLE `caro_matches` ADD COLUMN `draw_offered_at` DATETIME(3) NULL,
    ADD COLUMN `draw_offered_by_id` VARCHAR(30) NULL;

-- AlterTable
ALTER TABLE `game_profiles` MODIFY `avatar` VARCHAR(32) NOT NULL DEFAULT '🐷';
