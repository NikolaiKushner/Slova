CREATE TABLE `card_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`card_id` integer NOT NULL,
	`status` text DEFAULT 'learning' NOT NULL,
	`ease` real DEFAULT 2.5 NOT NULL,
	`interval_days` real DEFAULT 0 NOT NULL,
	`due_at` text NOT NULL,
	`correct_streak` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`last_reviewed_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_progress_user_card_idx` ON `card_progress` (`user_id`,`card_id`);--> statement-breakpoint
CREATE INDEX `card_progress_user_due_idx` ON `card_progress` (`user_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `review_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`card_id` integer NOT NULL,
	`rating` text NOT NULL,
	`mode` text DEFAULT 'flashcards' NOT NULL,
	`reviewed_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_log_user_reviewed_idx` ON `review_log` (`user_id`,`reviewed_at`);