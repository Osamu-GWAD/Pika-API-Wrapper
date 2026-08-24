import { fileURLToPath } from 'node:url';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    alias: {
      entries: [
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      ],
    },
  },
});
