import { match, P } from 'ts-pattern';

export type StatusOutcome =
  | { kind: 'success'; body: unknown }
  | { kind: 'empty' } // 204 and bodyless 404 responses represent an empty result rather than an error
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
      isEmptyBody(body)
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

function resolveRoutePath(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'path' in body && typeof body.path === 'string')
    return body.path;
  return fallback;
}
