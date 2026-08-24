import { PikaNetworkRecapResponseSchema } from '@/networks/pika-network/schemas';
import type { PikaNetworkMixinConstructor } from '@/networks/pika-network/mixins/mixin-constructor';
import type { PikaNetworkRecapResponse } from '@/networks/pika-network/schemas';
import type { RequestConfig } from '@/types';

export interface RecapsMixin {
  getMatchRecap(
    gameId: string,
    config?: RequestConfig,
  ): Promise<PikaNetworkRecapResponse | null>;
}

export function withRecaps<TBase extends PikaNetworkMixinConstructor>(
  Base: TBase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TBase & (abstract new (...arguments_: any[]) => RecapsMixin) {
  abstract class WithRecaps extends Base implements RecapsMixin {
    /**
     * `null` if the uuid doesn't exist.
     *
     * recaps are immutable but keyed by a UUID you won't re-request;
     * override via config if you want caching anyway.
     * this is unnecessary, i know.
     */
    async getMatchRecap(
      gameId: string,
      config?: RequestConfig,
    ): Promise<PikaNetworkRecapResponse | null> {
      const url = `${this.baseUrl}/recaps/${encodeURIComponent(gameId)}`;
      return this.fetchAndValidate(
        `pika-network:recap:${gameId}`,
        url,
        PikaNetworkRecapResponseSchema,
        {
          skipCache: true,
          ...config,
        },
      );
    }
  }

  return WithRecaps;
}
