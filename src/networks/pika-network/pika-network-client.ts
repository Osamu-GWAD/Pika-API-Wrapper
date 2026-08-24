import { defu } from 'defu';
import { NetworkClient } from '@/client';
import { withClans } from '@/networks/pika-network/mixins/clans-mixin';
import { withLeaderboards } from '@/networks/pika-network/mixins/leaderboards-mixin';
import { withPing } from '@/networks/pika-network/mixins/ping-mixin';
import { withProfile } from '@/networks/pika-network/mixins/profile-mixin';
import { withProfileStats } from '@/networks/pika-network/mixins/profile-stats-mixin';
import { withRecaps } from '@/networks/pika-network/mixins/recaps-mixin';
import {
  PikaNetworkDefaultBaseUrl,
  PikaNetworkDefaultRateLimit,
} from '@/networks/pika-network/pika-network-defaults';
import type { NetworkClientOptions } from '@/client';
import type { PikaNetworkMixinConstructor } from '@/networks/pika-network/mixins/mixin-constructor';

export interface PikaNetworkClientOptions extends NetworkClientOptions {
  baseUrl?: string;
}

// composed step by step rather than nested, both for readability
// and because deeply nested calls are just genuinely harder to read
const withLeaderboardsMixin = withLeaderboards(
  NetworkClient as PikaNetworkMixinConstructor,
);
const withProfileStatsMixin = withProfileStats(withLeaderboardsMixin);
const withProfileMixin = withProfile(withProfileStatsMixin);
const withClansMixin = withClans(withProfileMixin);
const withRecapsMixin = withRecaps(withClansMixin);
const PikaNetworkFeatureSet = withPing(withRecapsMixin);

/**
 * typed, runtime-validated client
 */
export class PikaNetworkClient extends PikaNetworkFeatureSet {
  protected readonly networkName = 'PikaNetwork';
  protected readonly baseUrl: string;

  constructor(options: PikaNetworkClientOptions = {}) {
    super(defu(options, { rateLimit: PikaNetworkDefaultRateLimit }));
    this.baseUrl = options.baseUrl ?? PikaNetworkDefaultBaseUrl;
  }
}
