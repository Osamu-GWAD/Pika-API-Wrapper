import { z } from 'zod';
import type { PikaNetworkMixinConstructor } from '@/networks/pika-network/mixins/mixin-constructor';
import type { RequestConfig } from '@/types';

const pingSchema = z.string();

export interface PingMixin {
  ping(config?: RequestConfig): Promise<boolean>;
}

export function withPing<TBase extends PikaNetworkMixinConstructor>(
  Base: TBase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TBase & (abstract new (...arguments_: any[]) => PingMixin) {
  abstract class WithPing extends Base implements PingMixin {
    /**
     * `true` if the API responds with "Pong!"
     */
    async ping(config?: RequestConfig): Promise<boolean> {
      try {
        const url = `${this.baseUrl}/ping`;
        const raw = await this.fetchAndValidate('pika-network:ping', url, pingSchema, {
          skipCache: true,
          ...config,
        });
        return raw === 'Pong!';
      } catch {
        return false;
      }
    }
  }

  return WithPing;
}
