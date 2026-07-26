import tokensJson from '@lgtm-hq/turbo-themes/tokens.json' with { type: 'json' };

// Sample the first shipped theme rather than a hardcoded ID so the fixture
// survives theme renames.
const sampleId = tokensJson.meta?.themeIds?.[0];

console.log(
  JSON.stringify({
    themes: Object.keys(tokensJson.themes ?? {}).length,
    themeIds: tokensJson.meta?.themeIds?.length ?? 0,
    byVendor: Object.keys(tokensJson.byVendor ?? {}).length,
    sampleId: sampleId ?? null,
    hasBrandPrimary: Boolean(tokensJson.themes?.[sampleId]?.tokens?.brand?.primary),
  }),
);
