import { createConsola } from 'consola';

/**
 * internal logger for diagnostics. silent by default (`level: -999`);
 *
 * consumers must explicitly opt in to avoid unsolicited
 * stdout/stderr output from the library.
 *
 * enable with `setLogLevel("warn")`.
 */
export const logger = createConsola({ level: -999 }).withTag('craftify');

export function setLogLevel(level: 'silent' | 'warn' | 'info' | 'debug'): void {
  const levels = { silent: -999, warn: 1, info: 3, debug: 4 } as const;
  logger.level = levels[level];
}
