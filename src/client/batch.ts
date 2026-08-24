import PQueue from 'p-queue';
import type { BatchOptions, BatchResult } from '@/types';

/**
 * runs a set of operations with bounded concurrency. each operation's
 * result type is inferred individually (like `Promise.all`'s tuple
 * overload), so mixed-type batches stay fully typed instead of widening
 * to a shared union.
 *
 * operations are settled independently by default; `throwOnError` aggregates
 * failures and throws after all operations have completed.
 */
export async function runBatch<const T extends readonly (() => Promise<unknown>)[]>(
  operations: T,
  defaultQueue: PQueue,
  options: BatchOptions = {},
): Promise<{ [K in keyof T]: BatchResult<Awaited<ReturnType<T[K]>>> }> {
  const queue = options.concurrency
    ? new PQueue({ concurrency: options.concurrency })
    : defaultQueue;
  let completed = 0;

  const settled = await Promise.all(
    operations.map((operation) =>
      queue.add(async (): Promise<BatchResult<unknown>> => {
        try {
          return { status: 'fulfilled', value: await operation() };
        } catch (error) {
          return { status: 'rejected', reason: error };
        } finally {
          completed++;
          options.onProgress?.(completed, operations.length);
        }
      }),
    ),
  );
  // `PQueue#add` types its return as possibly `void` to account for abort/timeout
  // options we don't use here, so every settled entry is always a real result
  const results = settled as { [K in keyof T]: BatchResult<Awaited<ReturnType<T[K]>>> };

  if (options.throwOnError) {
    const failures = (settled as BatchResult<unknown>[]).filter(
      (result) => result.status === 'rejected',
    );
    if (failures.length > 0) {
      throw new AggregateError(
        failures.map((failure) => failure.reason),
        `${failures.length}/${settled.length} batch operations failed`,
      );
    }
  }

  return results;
}
