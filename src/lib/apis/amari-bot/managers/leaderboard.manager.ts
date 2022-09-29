import { isNullOrUndefined } from '@sapphire/utilities';
import type { AmariClient } from '../client/amari.client.js';
import { Routes } from '../client/routes.api.js';
import { Leaderboard, LeaderboardTypes, LevelsLeaderboard, WeeklyLeaderboard } from '../structures/leaderboard.structure.js';
import type { APILeaderboard, APIWeeklyLeaderboard } from '../types/leaderboard.js';
import { BaseFetchOptions, Manager } from './manager.js';

export interface FetchLeaderboardOptions extends BaseFetchOptions {
	raw?: boolean;
	type: LeaderboardTypes;
}

export type Leaderboards = LevelsLeaderboard | WeeklyLeaderboard;

export class LeaderboardManager extends Manager<Leaderboard, Leaderboards | string> {
	public constructor(client: AmariClient) {
		super(client, Leaderboard);
	}

	public fetch<T extends LeaderboardTypes>(guildId: string, options: FetchLeaderboardOptions & { type?: T }): Promise<typeof options extends { force: true } ? Leaderboard : Leaderboard | null>;
	public async fetch<T extends LeaderboardTypes>(guildId: string, options: FetchLeaderboardOptions & { type?: T }): Promise<Leaderboard | null> {
		const cached = this.resolve(guildId);
		if (isNullOrUndefined(cached)) return null;

		const endpoint = Routes.guildLeaderboard(guildId, options.type === LeaderboardTypes.Weekly, options.raw ?? false);
		const fetch = <T extends APILeaderboard | APIWeeklyLeaderboard>() => this.client.requestHandler.request<T>(endpoint);
		const fetchLevelsLeaderboard = fetch<APILeaderboard>;
		const fetchWeeklyLeaderboard = fetch<APIWeeklyLeaderboard>;

		switch(options.type) {
			default:
			case LeaderboardTypes.Levels: {
				const levelsLeaderboard = new LevelsLeaderboard(await fetchLevelsLeaderboard(), LeaderboardTypes.Levels);
				return this.add(guildId, levelsLeaderboard);
			}

			case LeaderboardTypes.Weekly: {
				const weeklyLeaderboard = new WeeklyLeaderboard(await fetchWeeklyLeaderboard(), LeaderboardTypes.Weekly);
				return this.add(guildId, weeklyLeaderboard as unknown as Leaderboard);
			}
		}
	}
}