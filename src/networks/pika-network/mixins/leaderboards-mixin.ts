import {
  PikaNetworkRequiredMode,
  PikaNetworkStatAliases,
  type PikaNetworkGamemode,
} from '@/networks/pika-network/enums';
import {
  assertValidCombination,
  resolveDefaultMode,
} from '@/networks/pika-network/guards';
import {
  PikaNetworkLeaderboardResponseSchema,
  PikaNetworkTotalsResponseSchema,
} from '@/networks/pika-network/schemas';
import {
  toLeaderboardPage,
  type GetLeaderboardParams,
  type GetTotalsParams,
  type LeaderboardPage,
  type PikaNetworkTotalsResponse,
} from '@/networks/pika-network/types';
import type { PikaNetworkMixinConstructor } from '@/networks/pika-network/mixins/mixin-constructor';
import type { BatchOptions, BatchResult, RequestConfig } from '@/types';

export interface LeaderboardsMixin {
  getLeaderboard<G extends PikaNetworkGamemode = PikaNetworkGamemode>(
    parameters: GetLeaderboardParams<G>,
    config?: RequestConfig,
  ): Promise<LeaderboardPage>;
  getLeaderboards(
    requests: GetLeaderboardParams<PikaNetworkGamemode>[],
    config?: RequestConfig,
    options?: BatchOptions,
  ): Promise<BatchResult<LeaderboardPage>[]>;
  getTotals<G extends PikaNetworkGamemode = PikaNetworkGamemode>(
    parameters: GetTotalsParams<G>,
    config?: RequestConfig,
  ): Promise<PikaNetworkTotalsResponse>;
}

export function withLeaderboards<TBase extends PikaNetworkMixinConstructor>(
  Base: TBase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TBase & (abstract new (...arguments_: any[]) => LeaderboardsMixin) {
  abstract class WithLeaderboards extends Base implements LeaderboardsMixin {
    /** global leaderboard for a stat, paginated */
    async getLeaderboard<G extends PikaNetworkGamemode = PikaNetworkGamemode>(
      parameters: GetLeaderboardParams<G>,
      config?: RequestConfig,
    ): Promise<LeaderboardPage> {
      const {
        gamemode,
        stat,
        mode = resolveDefaultMode(gamemode),
        interval = 'total',
        page = 1,
        limit = 15,
      } = parameters;
      assertValidCombination(gamemode, mode, interval);

      // PikaNetwork enforces a maximum limit of 15; clamp to avoid broken offsets
      const effectiveLimit = Math.min(15, Math.max(1, limit));
      const offset = Math.max(0, (page - 1) * effectiveLimit);

      // Resolve stat aliases if configured (e.g. PROJECTILE_KILLS -> BOW_KILLS)
      const statStr = String(stat);
      const resolvedStat =
        (PikaNetworkStatAliases as Record<string, Record<string, string>>)[gamemode]?.[statStr] ??
        stat;

      const query = new URLSearchParams({
        type: gamemode,
        stat: String(resolvedStat),
        interval,
        mode,
        offset: String(offset),
        limit: String(effectiveLimit),
      });

      const url = `${this.baseUrl}/leaderboards?${query.toString()}`;
      const cacheKey = `pika-network:leaderboard:${gamemode}:${String(resolvedStat)}:${mode}:${interval}:${offset}:${effectiveLimit}`;

      const raw = await this.fetchAndValidate(
        cacheKey,
        url,
        PikaNetworkLeaderboardResponseSchema,
        config,
      );
      return raw ? toLeaderboardPage(raw) : { totalTracked: 0, entries: [] };
    }

    /**
     * leaderboards batch requests
     *
     * each request is resolved independently and preserves input order.
     */
    async getLeaderboards(
      requests: GetLeaderboardParams<PikaNetworkGamemode>[],
      config?: RequestConfig,
      options?: BatchOptions,
    ): Promise<BatchResult<LeaderboardPage>[]> {
      return this.batch(
        requests.map((request) => () => this.getLeaderboard(request, config)),
        options,
      );
    }

    /**
     * server-wide aggregate stats for a gamemode (totals/averages/sums)
     */
    async getTotals<G extends PikaNetworkGamemode = PikaNetworkGamemode>(
      parameters: GetTotalsParams<G>,
      config?: RequestConfig,
    ) {
      const { gamemode } = parameters;
      const params = new URLSearchParams({ type: gamemode });
      if (gamemode === 'pillars') {
        params.set('mode', PikaNetworkRequiredMode.pillars);
      }
      const url = `${this.baseUrl}/leaderboards/total?${params.toString()}`;
      const raw = await this.fetchAndValidate(
        `pika-network:totals:${gamemode}`,
        url,
        PikaNetworkTotalsResponseSchema,
        config,
      );
      return raw ?? [];
    }
  }

  return WithLeaderboards;
}
