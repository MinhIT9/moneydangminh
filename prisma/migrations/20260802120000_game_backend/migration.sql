-- CreateTable
CREATE TABLE `game_profiles` (
    `user_id` VARCHAR(30) NOT NULL,
    `player_code` VARCHAR(12) NOT NULL,
    `avatar` VARCHAR(32) NOT NULL DEFAULT '🐷',
    `presence` ENUM('ONLINE', 'MATCHMAKING', 'IN_ROOM', 'PLAYING', 'AWAY', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE',
    `hearts` INTEGER NOT NULL DEFAULT 5,
    `heart_recovery_started_at` DATETIME(3) NULL,
    `rating` INTEGER NOT NULL DEFAULT 500,
    `peak_rating` INTEGER NOT NULL DEFAULT 500,
    `ranked_wins` INTEGER NOT NULL DEFAULT 0,
    `ranked_losses` INTEGER NOT NULL DEFAULT 0,
    `ranked_draws` INTEGER NOT NULL DEFAULT 0,
    `friendly_wins` INTEGER NOT NULL DEFAULT 0,
    `friendly_losses` INTEGER NOT NULL DEFAULT 0,
    `friendly_draws` INTEGER NOT NULL DEFAULT 0,
    `current_win_streak` INTEGER NOT NULL DEFAULT 0,
    `longest_win_streak` INTEGER NOT NULL DEFAULT 0,
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `game_profiles_player_code_key`(`player_code`),
    INDEX `game_profiles_rating_idx`(`rating`),
    INDEX `game_profiles_presence_last_seen_at_idx`(`presence`, `last_seen_at`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_friendships` (
    `id` VARCHAR(30) NOT NULL,
    `requester_id` VARCHAR(30) NOT NULL,
    `addressee_id` VARCHAR(30) NOT NULL,
    `blocked_by_id` VARCHAR(30) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `game_friendships_addressee_id_status_idx`(`addressee_id`, `status`),
    INDEX `game_friendships_requester_id_status_idx`(`requester_id`, `status`),
    UNIQUE INDEX `game_friendships_requester_id_addressee_id_key`(`requester_id`, `addressee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caro_rooms` (
    `id` VARCHAR(30) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `host_id` VARCHAR(30) NOT NULL,
    `guest_id` VARCHAR(30) NULL,
    `status` ENUM('WAITING', 'READY', 'PLAYING', 'FINISHED', 'CLOSED') NOT NULL DEFAULT 'WAITING',
    `host_ready` BOOLEAN NOT NULL DEFAULT true,
    `guest_ready` BOOLEAN NOT NULL DEFAULT false,
    `turn_seconds` INTEGER NOT NULL DEFAULT 45,
    `blocked_ends` BOOLEAN NOT NULL DEFAULT true,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `caro_rooms_code_key`(`code`),
    INDEX `caro_rooms_host_id_status_idx`(`host_id`, `status`),
    INDEX `caro_rooms_guest_id_status_idx`(`guest_id`, `status`),
    INDEX `caro_rooms_status_expires_at_idx`(`status`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caro_matches` (
    `id` VARCHAR(30) NOT NULL,
    `room_id` VARCHAR(30) NULL,
    `player_x_id` VARCHAR(30) NOT NULL,
    `player_o_id` VARCHAR(30) NOT NULL,
    `winner_id` VARCHAR(30) NULL,
    `mode` ENUM('RANKED', 'FRIENDLY') NOT NULL,
    `status` ENUM('ACTIVE', 'X_WON', 'O_WON', 'DRAW', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `result_reason` ENUM('FIVE_IN_ROW', 'SURRENDER', 'TIMEOUT', 'AGREED_DRAW', 'BOARD_FULL', 'CANCELLED') NULL,
    `current_turn` ENUM('X', 'O') NOT NULL DEFAULT 'X',
    `turn_started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `turn_seconds` INTEGER NOT NULL DEFAULT 45,
    `player_x_rating` INTEGER NOT NULL,
    `player_o_rating` INTEGER NOT NULL,
    `player_x_change` INTEGER NULL,
    `player_o_change` INTEGER NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ended_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `caro_matches_player_x_id_status_started_at_idx`(`player_x_id`, `status`, `started_at`),
    INDEX `caro_matches_player_o_id_status_started_at_idx`(`player_o_id`, `status`, `started_at`),
    INDEX `caro_matches_mode_status_started_at_idx`(`mode`, `status`, `started_at`),
    INDEX `caro_matches_room_id_idx`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caro_moves` (
    `id` VARCHAR(30) NOT NULL,
    `match_id` VARCHAR(30) NOT NULL,
    `player_id` VARCHAR(30) NOT NULL,
    `move_number` INTEGER NOT NULL,
    `mark` ENUM('X', 'O') NOT NULL,
    `row` INTEGER NOT NULL,
    `column` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `caro_moves_player_id_created_at_idx`(`player_id`, `created_at`),
    UNIQUE INDEX `caro_moves_match_id_move_number_key`(`match_id`, `move_number`),
    UNIQUE INDEX `caro_moves_match_id_row_column_key`(`match_id`, `row`, `column`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_messages` (
    `id` VARCHAR(30) NOT NULL,
    `sender_id` VARCHAR(30) NOT NULL,
    `recipient_id` VARCHAR(30) NULL,
    `room_id` VARCHAR(30) NULL,
    `match_id` VARCHAR(30) NULL,
    `scope` ENUM('DIRECT', 'ROOM', 'MATCH') NOT NULL,
    `kind` ENUM('TEXT', 'QUICK', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
    `content` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `game_messages_recipient_id_created_at_idx`(`recipient_id`, `created_at`),
    INDEX `game_messages_room_id_created_at_idx`(`room_id`, `created_at`),
    INDEX `game_messages_match_id_created_at_idx`(`match_id`, `created_at`),
    INDEX `game_messages_sender_id_created_at_idx`(`sender_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_invites` (
    `id` VARCHAR(30) NOT NULL,
    `sender_id` VARCHAR(30) NOT NULL,
    `recipient_id` VARCHAR(30) NOT NULL,
    `room_id` VARCHAR(30) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `game_invites_recipient_id_status_expires_at_idx`(`recipient_id`, `status`, `expires_at`),
    INDEX `game_invites_room_id_status_idx`(`room_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_notifications` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(30) NOT NULL,
    `type` ENUM('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'NEW_MESSAGE', 'ROOM_INVITE', 'ROOM_JOINED', 'HEARTS_FULL', 'RANK_UP', 'ACHIEVEMENT') NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `body` VARCHAR(500) NULL,
    `href` VARCHAR(500) NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `game_notifications_user_id_read_at_created_at_idx`(`user_id`, `read_at`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matchmaking_queue` (
    `user_id` VARCHAR(30) NOT NULL,
    `rating` INTEGER NOT NULL,
    `enqueued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `matchmaking_queue_rating_enqueued_at_idx`(`rating`, `enqueued_at`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `game_profiles` ADD CONSTRAINT `game_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_friendships` ADD CONSTRAINT `game_friendships_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_friendships` ADD CONSTRAINT `game_friendships_addressee_id_fkey` FOREIGN KEY (`addressee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_friendships` ADD CONSTRAINT `game_friendships_blocked_by_id_fkey` FOREIGN KEY (`blocked_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caro_rooms` ADD CONSTRAINT `caro_rooms_host_id_fkey` FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caro_rooms` ADD CONSTRAINT `caro_rooms_guest_id_fkey` FOREIGN KEY (`guest_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caro_matches` ADD CONSTRAINT `caro_matches_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `caro_rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caro_matches` ADD CONSTRAINT `caro_matches_player_x_id_fkey` FOREIGN KEY (`player_x_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caro_matches` ADD CONSTRAINT `caro_matches_player_o_id_fkey` FOREIGN KEY (`player_o_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caro_matches` ADD CONSTRAINT `caro_matches_winner_id_fkey` FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caro_moves` ADD CONSTRAINT `caro_moves_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `caro_matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caro_moves` ADD CONSTRAINT `caro_moves_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_messages` ADD CONSTRAINT `game_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_messages` ADD CONSTRAINT `game_messages_recipient_id_fkey` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_messages` ADD CONSTRAINT `game_messages_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `caro_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_messages` ADD CONSTRAINT `game_messages_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `caro_matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_invites` ADD CONSTRAINT `game_invites_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_invites` ADD CONSTRAINT `game_invites_recipient_id_fkey` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_invites` ADD CONSTRAINT `game_invites_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `caro_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_notifications` ADD CONSTRAINT `game_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matchmaking_queue` ADD CONSTRAINT `matchmaking_queue_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
