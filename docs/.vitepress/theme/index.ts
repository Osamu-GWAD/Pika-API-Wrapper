import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import CatalogSearch from './CatalogSearch.vue';
import CraftifyStats from './CraftifyStats.vue';
import './custom.css';
import LeaderboardPlayground from './LeaderboardPlayground.vue';
import LiveEndpoint from './LiveEndpoint.vue';
import ScrollProgress from './ScrollProgress.vue';
import type { Theme } from 'vitepress';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(ScrollProgress),
    }),
  enhanceApp({ app }) {
    app.component('CraftifyStats', CraftifyStats);
    app.component('CatalogSearch', CatalogSearch);
    app.component('LeaderboardPlayground', LeaderboardPlayground);
    app.component('LiveEndpoint', LiveEndpoint);
  },
} satisfies Theme;
