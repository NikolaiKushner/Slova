CREATE TABLE `password_reset_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
ALTER TABLE `card_progress` ADD `introduced_at` text;--> statement-breakpoint
ALTER TABLE `review_log` ADD `prev_state` text;--> statement-breakpoint
UPDATE `card_progress` SET `introduced_at` = COALESCE(
	(SELECT min(`reviewed_at`) FROM `review_log`
	 WHERE `review_log`.`user_id` = `card_progress`.`user_id`
	   AND `review_log`.`card_id` = `card_progress`.`card_id`),
	`last_reviewed_at`
) WHERE `introduced_at` IS NULL;