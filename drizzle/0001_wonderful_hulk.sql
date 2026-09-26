CREATE TABLE `telemetry_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`polledAt` timestamp NOT NULL DEFAULT (now()),
	`dockerStatus` varchar(32) NOT NULL,
	`bgpState` varchar(32) NOT NULL,
	`ospfState` varchar(32) NOT NULL,
	`defaultRouteState` varchar(32) NOT NULL,
	CONSTRAINT `telemetry_history_id` PRIMARY KEY(`id`)
);
