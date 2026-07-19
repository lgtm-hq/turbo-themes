import { catalog, catalogById } from '@lgtm-hq/turbo-themes/catalog';
import catalogJson from '@lgtm-hq/turbo-themes/catalog.json' with { type: 'json' };

console.log(
  JSON.stringify({
    catalog: catalog.length,
    catalogById: Object.keys(catalogById).length,
    catalogJson: Array.isArray(catalogJson) ? catalogJson.length : 0,
    hasPreview: Boolean(catalog[0]?.preview?.bg),
    catalogJsonHasPreview: Boolean(catalogJson[0]?.preview?.bg),
  }),
);
