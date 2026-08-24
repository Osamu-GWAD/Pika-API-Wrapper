import { match } from 'ts-pattern';
import {
  PikaNetworkModes,
  PikaNetworkRequiredMode,
  YearlyCapableGamemodes,
  type PikaNetworkGamemode,
  type PikaNetworkInterval,
} from '@/networks/pika-network/enums';

export function resolveDefaultMode<G extends PikaNetworkGamemode>(gamemode: G) {
  const required = (PikaNetworkRequiredMode as Record<string, string>)[gamemode];
  return (required ?? 'ALL_MODES') as never;
}

/**
 * rejects invalid gamemode/mode/interval combinations beforehand.
 * refer to the gamemodes and enums guide.
 */
export function assertValidCombination(
  gamemode: PikaNetworkGamemode,
  mode: string,
  interval: PikaNetworkInterval,
): void {
  const validModes = PikaNetworkModes[gamemode] as readonly string[];
  const isYearly = interval === 'yearly';
  const isYearlyCapable = (YearlyCapableGamemodes as readonly string[]).includes(
    gamemode,
  );

  const error = match({
    modeIsValid: validModes.includes(mode),
    isYearly,
    isYearlyCapable,
  })
    .with(
      { modeIsValid: false },
      () =>
        `"${mode}" is not a valid mode for gamemode "${gamemode}". Valid modes: ${validModes.join(', ')}`,
    )
    .with(
      { isYearly: true, isYearlyCapable: false },
      () =>
        `interval="yearly" is only supported for ${YearlyCapableGamemodes.join(' and ')} — "${gamemode}" will silently return empty results instead of erroring, so this is checked client-side.`,
    )
    .otherwise(() => null);

  if (error) throw new RangeError(error);
}
