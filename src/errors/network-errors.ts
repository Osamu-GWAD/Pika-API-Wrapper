/**
 * base error for failures raised by a network stats API client
 *
 * `network` identifies the backend that produced the error, allowing callers
 * to distinguish failures when handling multiple network clients.
 */
export class NetworkAPIError extends Error {
  readonly network: string;
  readonly status: number | undefined;
  readonly url?: string;

  constructor(
    network: string,
    message: string,
    options: { status?: number; url?: string; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.network = network;
    this.status = options.status;
    this.url = options.url;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * indicates a malformed request.
 *
 * e.g. invalid gamemode/mode/stat/interval combination, missing param, etc.
 * HTTP 400
 */
export class NetworkBadRequestError extends NetworkAPIError {
  constructor(
    network: string,
    message: string,
    options: { url?: string; cause?: unknown } = {},
  ) {
    super(network, message, { ...options, status: 400 });
  }
}

/**
 * a generic HTTP failure (405/500/502/503/504/etc.) that isn't one of the
 * more specific cases below.
 *
 * entity-not-found responses are handled separately and resolve to `null`.
 * see the client docs.
 */
export class NetworkHTTPError extends NetworkAPIError {}

/**
 * indicates that the upstream API is rate-limiting requests (HTTP 429).
 * back off!
 *
 * built-in rate limiter tries to prevent this from ever firing.
 */
export class NetworkRateLimitError extends NetworkAPIError {
  readonly retryAfterMs: number | undefined;

  constructor(
    network: string,
    message: string,
    options: { url?: string; retryAfterMs?: number; cause?: unknown } = {},
  ) {
    super(network, message, { ...options, status: 429 });
    this.retryAfterMs = options.retryAfterMs;
  }
}

/**
 * indicates that the response does not conform to the expected schema.
 *
 * typically indicates an upstream response shape change or unexpected payload.
 * it shouldn't happen, but- CraftiGames~
 */
export class NetworkValidationError extends NetworkAPIError {
  readonly issues: unknown;

  constructor(
    network: string,
    message: string,
    options: { url?: string; issues?: unknown; cause?: unknown } = {},
  ) {
    super(network, message, options);
    this.issues = options.issues;
  }
}

/**
 * indicates that all configured API credentials have been exhausted.
 *
 * reserved for networks that require authentication.
 */
export class NetworkAuthExhaustedError extends NetworkAPIError {}
