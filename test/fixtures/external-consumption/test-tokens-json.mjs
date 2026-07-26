import tokensJson from '@lgtm-hq/turbo-themes/tokens.json' with { type: 'json' };

console.log(
  JSON.stringify({
    themes: Object.keys(tokensJson.themes ?? {}).length,
    themeIds: tokensJson.meta?.themeIds?.length ?? 0,
    byVendor: Object.keys(tokensJson.byVendor ?? {}).length,
    hasBrandPrimary: Boolean(tokensJson.themes?.['catppuccin-mocha']?.tokens?.brand?.primary),
  }),
);
