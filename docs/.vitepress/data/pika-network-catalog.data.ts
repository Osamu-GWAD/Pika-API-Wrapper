import {
  PikaNetworkGamemodes,
  PikaNetworkModes,
  PikaNetworkRequiredMode,
  PikaNetworkStatAliases,
  PikaNetworkStats,
  YearlyCapableGamemodes,
  type PikaNetworkGamemode,
} from '../../../src/networks/pika-network/enums';

export interface CatalogStat {
  rawKey: string;
  displayName: string | null;
}

export interface CatalogGamemode {
  gamemode: PikaNetworkGamemode;
  modes: readonly string[];
  requiredMode: string | null;
  yearlyCapable: boolean;
  stats: CatalogStat[];
  aliases: { alias: string; canonical: string }[];
}

export interface PikaNetworkCatalogData {
  gamemodes: CatalogGamemode[];
}

export default {
  watch: ['../../../src/networks/pika-network/enums.ts'],
  load(): PikaNetworkCatalogData {
    const aliasesByGamemode = PikaNetworkStatAliases as Record<
      string,
      Record<string, string> | undefined
    >;

    const gamemodes = PikaNetworkGamemodes.map((gamemode): CatalogGamemode => {
      const stats = PikaNetworkStats[gamemode] as Record<string, string | null>;
      const aliasMap = aliasesByGamemode[gamemode] ?? {};

      return {
        gamemode,
        modes: PikaNetworkModes[gamemode],
        requiredMode:
          (PikaNetworkRequiredMode as Record<string, string>)[gamemode] ?? null,
        yearlyCapable: (YearlyCapableGamemodes as readonly string[]).includes(gamemode),
        stats: Object.entries(stats).map(([rawKey, displayName]) => ({
          rawKey,
          displayName,
        })),
        aliases: Object.entries(aliasMap).map(([alias, canonical]) => ({
          alias,
          canonical,
        })),
      };
    });

    return { gamemodes };
  },
};
