import { initTheme, wireFlavorSelector } from '@lgtm-hq/turbo-themes/selector';
console.log(
  JSON.stringify({
    hasInitTheme: typeof initTheme === 'function',
    hasWireFlavorSelector: typeof wireFlavorSelector === 'function',
  }),
);
