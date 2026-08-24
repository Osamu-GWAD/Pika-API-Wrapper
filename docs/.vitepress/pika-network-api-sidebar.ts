import { fileURLToPath } from 'node:url';
import { buildOrderedSidebar } from './ordered-sidebar';
import type { DefaultTheme } from 'vitepress';

const pikaNetworkApiDirectory = fileURLToPath(
  new URL('../pika-network-api', import.meta.url),
);

export function buildPikaNetworkApiSidebar(): DefaultTheme.SidebarItem[] {
  return buildOrderedSidebar(
    pikaNetworkApiDirectory,
    '/pika-network-api/',
    'PikaNetwork API',
  );
}
