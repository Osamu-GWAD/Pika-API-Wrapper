declare module '*.css';
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}
declare module '*/typedoc-sidebar.json' {
  import type { DefaultTheme } from 'vitepress';

  const sidebar: DefaultTheme.SidebarItem[];
  export default sidebar;
}
