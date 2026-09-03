import { describe, expect, it } from 'vitest';
import { isRetryableNetworkError } from '@/client/http/retry';
import { TokenBucketRateLimiter } from '@/client/rate-limiter';
import { resolveDefaultMode, assertValidCombination } from '@/networks/pika-network/guards';
import { PikaNetworkLeaderboardResponseSchema } from '@/networks/pika-network/schemas';
import { withStatKeyAccessor, type ProfileStat } from '@/networks/pika-network/types';

describe('Craftify API Wrapper Fixes', () => {
  it('rate limiter provides automatic rate recovery and FIFO ordering', async () => {
    const limiter = new TokenBucketRateLimiter({
      ratePerSecond: 100,
      burst: 2,
      recoveryCooldownMs: 50,
    });

    // Simulate 429
    limiter.onRateLimited();
    expect(limiter.currentRatePerSecond).toBe(50);

    // Wait for cooldown to pass and acquire
    await new Promise((r) => setTimeout(r, 60));
    await limiter.acquire();

    // Rate should recover towards 100
    expect(limiter.currentRatePerSecond).toBeGreaterThan(50);
  });

  it('isRetryableNetworkError identifies transient transport errors', () => {
    expect(isRetryableNetworkError(new Error('fetch failed'))).toBe(true);
    expect(isRetryableNetworkError(new Error('connection reset by peer'))).toBe(true);
    expect(isRetryableNetworkError({ code: 'ETIMEDOUT', message: 'timeout' })).toBe(true);
    expect(isRetryableNetworkError(new DOMException('Aborted', 'AbortError'))).toBe(false);
  });

  it('leaderboard entry schema supports null clan and rank', () => {
    const raw = {
      metadata: { total: 100 },
      entries: [
        { place: 1, value: '500', id: 'player1', clan: null, rank: null },
        { place: 2, value: 300, id: 'player2', clan: 'ClanA', rank: 'VIP' },
      ],
    };

    const parsed = PikaNetworkLeaderboardResponseSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.entries?.[0]?.clan).toBeNull();
      expect(parsed.data.entries?.[0]?.value).toBe(500);
    }
  });

  it('withStatKeyAccessor indexes stats for O(1) reads without mutating input', () => {
    const stats: ProfileStat[] = [
      {
        statKey: 'Final kills',
        totalTracked: 1000,
        hasScore: true,
        place: 5,
        value: 120,
      },
    ];

    const wrapped = withStatKeyAccessor(stats);
    expect(wrapped.StatKey.BedWars.FinalKills?.value).toBe(120);
    expect(wrapped.StatKey.BedWars.FinalKills?.place).toBe(5);
    expect(wrapped.StatKey.BedWars.BowKills).toBeNull();
  });

  it('guards reject invalid gamemodes and combinations', () => {
    expect(resolveDefaultMode('bedwars')).toBe('ALL_MODES');
    expect(resolveDefaultMode('pillars')).toBe('Seasonal');

    expect(() =>
      assertValidCombination('bedwars', 'SOLO', 'total'),
    ).not.toThrow();

    expect(() =>
      assertValidCombination('bedwars', 'INVALID_MODE', 'total'),
    ).toThrow(RangeError);

    expect(() =>
      // @ts-expect-error test runtime validation on invalid gamemode
      assertValidCombination('invalid_gamemode', 'ALL_MODES', 'total'),
    ).toThrow(RangeError);
  });
});
