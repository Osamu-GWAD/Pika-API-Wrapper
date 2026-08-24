import type { NetworkClient } from '@/client';

/**
 * constrains mixin bases to constructors that produce a `NetworkClient`
 *
 * the `any[]` signature satisfies TypeScript's mixin constructor requirement
 * while preserving access to the base class's protected members.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional; not a real leak!!
export type PikaNetworkMixinConstructor = new (...arguments_: any[]) => NetworkClient;
