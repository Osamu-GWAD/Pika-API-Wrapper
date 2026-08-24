import { z } from 'zod';

/**
 * numeric fields sometimes arrive as unrounded IEEE-754 string floats
 * (e.g. balance: "5158777955980.7333984375"; see docs section 3.5), and
 * sometimes as plain numbers. coerce either into a number.
 */
const numericString = z.union([z.string(), z.number()]).transform(Number);

const leaderboardEntrySchema = z.object({
  place: z.number(),
  value: numericString,
  id: z.string(),
  clan: z.string().optional(),
  rank: z.string().optional(),
});

export const PikaNetworkLeaderboardResponseSchema = z.object({
  metadata: z.object({ total: z.number() }),
  entries: z.array(leaderboardEntrySchema).nullable(),
});
export type PikaNetworkLeaderboardResponse = z.infer<
  typeof PikaNetworkLeaderboardResponseSchema
>;

/**
 * GET /profile/{username}/leaderboard
 */
export const PikaNetworkProfileStatsResponseSchema = z.record(
  z.string(),
  PikaNetworkLeaderboardResponseSchema,
);
export type PikaNetworkProfileStatsResponse = z.infer<
  typeof PikaNetworkProfileStatsResponseSchema
>;

/**
 * GET /leaderboards/total
 */
const totalsEntrySchema = z.object({
  name: z.string(),
  total: z.number(),
  average: z.number(),
  sum: z.number(),
});
export const PikaNetworkTotalsResponseSchema = z.array(totalsEntrySchema);
export type PikaNetworkTotalsResponse = z.infer<typeof PikaNetworkTotalsResponseSchema>;

const profileRankSchema = z.object({
  level: z.number().optional(),
  experience: z.number().optional(),
  percentage: z.number().optional(),
  rankDisplay: z.string().optional(),
});

const profileDonorRankSchema = z.object({
  name: z.string().optional(),
  displayName: z.string().optional(),
  server: z.string().optional(),
  season: z.string().nullable().optional(),
  expiry: z.number().optional(),
});

/**
 * GET /profile/{username}
 * HACK: kept permissive since this endpoint isn't formally specced and fields may vary by account state
 */
export const PikaNetworkProfileResponseSchema = z
  .object({
    username: z.string().optional(),
    lastSeen: z.number().optional(),
    discord_verified: z.boolean().optional(),
    email_verified: z.boolean().optional(),
    boosting: z.boolean().optional(),
    discord_boosting: z.boolean().optional(),
    rank: profileRankSchema.optional(),
    ranks: z.array(profileDonorRankSchema).optional(),
    clan: z
      .object({
        name: z.string().optional(),
        tag: z.string().optional(),
      })
      .nullable()
      .optional(),
    friends: z.array(z.unknown()).optional(),
  })
  .passthrough();
export type PikaNetworkProfileResponse = z.infer<typeof PikaNetworkProfileResponseSchema>;

/**
 * GET /clans/{clanName}
 * HACK: kept permissive
 */
export const PikaNetworkClanResponseSchema = z
  .object({
    name: z.string().optional(),
    tag: z.string().optional(),
    trophies: z.number().optional(),
    createdAt: z.number().optional(),
    members: z.array(z.unknown()).optional(),
  })
  .passthrough();
export type PikaNetworkClanResponse = z.infer<typeof PikaNetworkClanResponseSchema>;

/**
 * GET /recaps/{gameId}
 * HACK: kept permissive
 */
export const PikaNetworkRecapResponseSchema = z.record(z.string(), z.unknown());
export type PikaNetworkRecapResponse = z.infer<typeof PikaNetworkRecapResponseSchema>;
