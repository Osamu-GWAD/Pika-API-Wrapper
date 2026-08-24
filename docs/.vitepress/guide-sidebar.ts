import { fileURLToPath } from 'node:url';
import { buildOrderedSidebar } from './ordered-sidebar';
import type { DefaultTheme } from 'vitepress';

const guideDirectory = fileURLToPath(new URL('../guide', import.meta.url));

export function buildGuideSidebar(): DefaultTheme.SidebarItem[] {
  return buildOrderedSidebar(guideDirectory, '/guide/', 'Guide');
}
