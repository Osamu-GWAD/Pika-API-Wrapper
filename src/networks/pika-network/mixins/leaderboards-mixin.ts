import {
  PikaNetworkRequiredMode,
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
  getLeaderboard<G extends PikaNetworkGamemode>(
    parameters: GetLeaderboardParams<G>,
    config?: RequestConfig,
  ): Promise<LeaderboardPage>;
  getLeaderboards<G extends PikaNetworkGamemode>(
    requests: GetLeaderboardParams<G>[],
    config?: RequestConfig,
    options?: BatchOptions,
  ): Promise<BatchResult<LeaderboardPage>[]>;
  getTotals<G extends PikaNetworkGamemode>(
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
    async getLeaderboard<G extends PikaNetworkGamemode>(
      parameters: GetLeaderboardParams<G>,
      config?: RequestConfig,
    ): Promise<LeaderboardPage> {
      const {
        gamemode,
        stat,
        mode = resolveDefaultMode(gamemode),
        interval = 'total',
        page = 1,
        limit = 15, // the API enforces a maximum page size of 15 regardless of the requested limit
      } = parameters;
      assertValidCombination(gamemode, mode, interval);

      const offset = Math.max(0, (page - 1) * limit);
      const url =
        `${this.baseUrl}/leaderboards?type=${gamemode}&stat=${String(stat)}` +
        `&interval=${interval}&mode=${mode}&offset=${offset}&limit=${limit}`;
      const cacheKey = `pika-network:leaderboard:${gamemode}:${String(stat)}:${mode}:${interval}:${offset}:${limit}`;

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
    async getLeaderboards<G extends PikaNetworkGamemode>(
      requests: GetLeaderboardParams<G>[],
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
    async getTotals<G extends PikaNetworkGamemode>(
      parameters: GetTotalsParams<G>,
      config?: RequestConfig,
    ) {
      const { gamemode } = parameters;
      const extra =
        gamemode === 'pillars' ? `&mode=${PikaNetworkRequiredMode.pillars}` : '';
      const url = `${this.baseUrl}/leaderboards/total?type=${gamemode}${extra}`;
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
