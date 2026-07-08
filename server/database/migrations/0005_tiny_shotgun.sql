ALTER TABLE `sets` ADD `is_public` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sets` ADD `share_slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `sets_share_slug_unique` ON `sets` (`share_slug`);