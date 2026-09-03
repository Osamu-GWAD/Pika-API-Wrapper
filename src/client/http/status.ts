import { match, P } from 'ts-pattern';

export type StatusOutcome =
  | { kind: 'success'; body: unknown }
  | { kind: 'empty' } // 204 and not-found responses represent an empty entity rather than a hard failure
  | { kind: 'bad-request'; body: unknown }
  | { kind: 'http-error'; message: string }
  | { kind: 'retryable'; isRateLimit: boolean };

/**
 * maps a response into what the HTTP client should do next.
 *
 * centralizes the status-code contract documented in `PIKA_API_DOCUMENTATION.md`
 * so it isn't scattered across if/else branches.
 */
export function interpretStatus(
  status: number,
  body: unknown,
  url: string,
): StatusOutcome {
  return match(status)
    .with(200, () => ({ kind: 'success' as const, body }))
    .with(204, () => ({ kind: 'empty' as const }))
    .with(404, () =>
      isNotFoundEntity(body)
        ? { kind: 'empty' as const }
        : {
            kind: 'http-error' as const,
            message: `Route not found: ${resolveRoutePath(body, url)}`,
          },
    )
    .with(400, () => ({ kind: 'bad-request' as const, body }))
    .with(429, () => ({ kind: 'retryable' as const, isRateLimit: true }))
    .with(P.number.gte(500), () => ({ kind: 'retryable' as const, isRateLimit: false }))
    .otherwise(() => ({
      kind: 'http-error' as const,
      message: `Unexpected HTTP ${status} from ${url}`,
    }));
}

function isEmptyBody(body: unknown): boolean {
  return [null, undefined, ''].includes(body as null | undefined | string);
}

function isNotFoundEntity(body: unknown): boolean {
  if (isEmptyBody(body)) return true;

  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    // If it has a path property matching an unmapped router error without an entity message
    if ('path' in obj && typeof obj.path === 'string' && !('message' in obj)) {
      return false;
    }
    // Standard API missing entity error messages
    if (typeof obj.message === 'string' && /not found|does not exist|unknown/i.test(obj.message)) {
      return true;
    }
  }

  // Treat generic 404 on entity lookups as empty entity by default
  return true;
}

function resolveRoutePath(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'path' in body && typeof body.path === 'string')
    return body.path;
  return fallback;
}
