import { PikaNetworkProfileResponseSchema } from '@/networks/pika-network/schemas';
import type { PikaNetworkMixinConstructor } from '@/networks/pika-network/mixins/mixin-constructor';
import type { PikaNetworkProfileResponse } from '@/networks/pika-network/types';
import type { BatchOptions, BatchResult, RequestConfig } from '@/types';

export interface ProfileMixin {
  getProfile(
    username: string,
    config?: RequestConfig,
  ): Promise<PikaNetworkProfileResponse | null>;
  getProfiles(
    usernames: string[],
    config?: RequestConfig,
    options?: BatchOptions,
  ): Promise<BatchResult<PikaNetworkProfileResponse | null>[]>;
}

export function withProfile<TBase extends PikaNetworkMixinConstructor>(
  Base: TBase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TBase & (abstract new (...arguments_: any[]) => ProfileMixin) {
  abstract class WithProfile extends Base implements ProfileMixin {
    /**
     * returns `null` if the username doesn't exist
     */
    async getProfile(
      username: string,
      config?: RequestConfig,
    ): Promise<PikaNetworkProfileResponse | null> {
      const url = `${this.baseUrl}/profile/${encodeURIComponent(username)}`;
      return this.fetchAndValidate(
        `pika-network:profile:${username.toLowerCase()}`,
        url,
        PikaNetworkProfileResponseSchema,
        config,
      );
    }

    /**
     * profile batch requests
     *
     * preserves input order and returns an independent result for each lookup.
     */
    async getProfiles(
      usernames: string[],
      config?: RequestConfig,
      options?: BatchOptions,
    ): Promise<BatchResult<PikaNetworkProfileResponse | null>[]> {
      return this.batch(
        usernames.map((username) => () => this.getProfile(username, config)),
        options,
      );
    }
  }

  return WithProfile;
}
