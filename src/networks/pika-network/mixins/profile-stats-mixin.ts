import {
  assertValidCombination,
  resolveDefaultMode,
} from '@/networks/pika-network/guards';
import { PikaNetworkProfileStatsResponseSchema } from '@/networks/pika-network/schemas';
import { withStatKeyAccessor } from '@/networks/pika-network/types';
import type {
  PikaNetworkGamemode,
  PikaNetworkStatKey,
} from '@/networks/pika-network/enums';
import type { PikaNetworkMixinConstructor } from '@/networks/pika-network/mixins/mixin-constructor';
import type {
  GetProfileStatsParams,
  ProfileStat,
  ProfileStats,
} from '@/networks/pika-network/types';
import type { BatchOptions, BatchResult, RequestConfig } from '@/types';

export interface ProfileStatsMixin {
  getProfileStats<G extends PikaNetworkGamemode>(
    parameters: GetProfileStatsParams<G>,
    config?: RequestConfig,
  ): Promise<ProfileStats>;
  getProfileStat<G extends PikaNetworkGamemode>(
    parameters: GetProfileStatsParams<G>,
    statKey: PikaNetworkStatKey<G>,
    config?: RequestConfig,
  ): Promise<ProfileStat | null>;
  getProfileStatsBatch<G extends PikaNetworkGamemode>(
    requests: GetProfileStatsParams<G>[],
    config?: RequestConfig,
    options?: BatchOptions,
  ): Promise<BatchResult<ProfileStats>[]>;
}

export function withProfileStats<TBase extends PikaNetworkMixinConstructor>(
  Base: TBase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TBase & (abstract new (...arguments_: any[]) => ProfileStatsMixin) {
  abstract class WithProfileStats extends Base implements ProfileStatsMixin {
    /**
     * returns an empty array (not an error) for a player who exists
     * but has never played that gamemode/mode.
     */
    async getProfileStats<G extends PikaNetworkGamemode>(
      parameters: GetProfileStatsParams<G>,
      config?: RequestConfig,
    ): Promise<ProfileStats> {
      const {
        username,
        gamemode,
        mode = resolveDefaultMode(gamemode),
        interval = 'total',
      } = parameters;
      assertValidCombination(gamemode, mode, interval);

      const url = `${this.baseUrl}/profile/${encodeURIComponent(username)}/leaderboard?type=${gamemode}&interval=${interval}&mode=${mode}`;
      const cacheKey = `pika-network:profile-stats:${username.toLowerCase()}:${gamemode}:${mode}:${interval}`;

      const raw = await this.fetchAndValidate(
        cacheKey,
        url,
        PikaNetworkProfileStatsResponseSchema,
        config,
      );
      if (!raw) return withStatKeyAccessor([]);

      const results: ProfileStat[] = Object.entries(raw).map(([statKey, stat]) => ({
        statKey,
        totalTracked: stat.metadata.total,
        hasScore: stat.entries !== null,
        place: stat.entries?.[0]?.place ?? null,
        value: stat.entries?.[0]?.value ?? null,
      }));

      return withStatKeyAccessor(results);
    }

    /**
     * use the `StatKey` ergonomic constant for autocomplete;
     * e.g. `StatKey.BedWars.FinalKills`.
     *
     * `null` if the player has no score for it.
     */
    async getProfileStat<G extends PikaNetworkGamemode>(
      parameters: GetProfileStatsParams<G>,
      statKey: PikaNetworkStatKey<G>,
      config?: RequestConfig,
    ): Promise<ProfileStat | null> {
      const stats = await this.getProfileStats(parameters, config);
      return stats.find((stat) => stat.statKey === statKey) ?? null;
    }

    /**
     * profile stats batch requests
     *
     * preserves input order and returns an independent result for each lookup.
     */
    async getProfileStatsBatch<G extends PikaNetworkGamemode>(
      requests: GetProfileStatsParams<G>[],
      config?: RequestConfig,
      options?: BatchOptions,
    ): Promise<BatchResult<ProfileStats>[]> {
      return this.batch(
        requests.map((request) => () => this.getProfileStats(request, config)),
        options,
      );
    }
  }

  return WithProfileStats;
}
