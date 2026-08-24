import { PikaNetworkClanResponseSchema } from '@/networks/pika-network/schemas';
import type { PikaNetworkMixinConstructor } from '@/networks/pika-network/mixins/mixin-constructor';
import type { PikaNetworkClanResponse } from '@/networks/pika-network/types';
import type { BatchOptions, BatchResult, RequestConfig } from '@/types';

export interface ClansMixin {
  getClan(
    clanName: string,
    config?: RequestConfig,
  ): Promise<PikaNetworkClanResponse | null>;
  getClans(
    clanNames: string[],
    config?: RequestConfig,
    options?: BatchOptions,
  ): Promise<BatchResult<PikaNetworkClanResponse | null>[]>;
}

export function withClans<TBase extends PikaNetworkMixinConstructor>(
  Base: TBase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TBase & (abstract new (...arguments_: any[]) => ClansMixin) {
  abstract class WithClans extends Base implements ClansMixin {
    /**
     * returns `null` when the clan does not exist;
     * HACK (unsure): the response schema is intentionally permissive.
     */
    async getClan(
      clanName: string,
      config?: RequestConfig,
    ): Promise<PikaNetworkClanResponse | null> {
      const url = `${this.baseUrl}/clans/${encodeURIComponent(clanName)}`;
      return this.fetchAndValidate(
        `pika-network:clan:${clanName.toLowerCase()}`,
        url,
        PikaNetworkClanResponseSchema,
        config,
      );
    }

    /**
     * clan batch requests
     *
     * preserves input order and returns an independent result for each lookup.
     */
    async getClans(
      clanNames: string[],
      config?: RequestConfig,
      options?: BatchOptions,
    ): Promise<BatchResult<PikaNetworkClanResponse | null>[]> {
      return this.batch(
        clanNames.map((clanName) => () => this.getClan(clanName, config)),
        options,
      );
    }
  }

  return WithClans;
}
