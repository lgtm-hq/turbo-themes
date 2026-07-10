// SPDX-License-Identifier: MIT
// purgecss 8 ships a CommonJS default export (the plugin function) instead of
// the named purgeCSSPlugin export from v7
import purgeCSSPlugin from '@fullhuman/postcss-purgecss';
import purgecssConfig from './purgecss.config.js';
import cssnano from 'cssnano';

export default {
  plugins: [
    // Only purge in production
    ...(process.env.NODE_ENV === 'production' ? [purgeCSSPlugin(purgecssConfig)] : []),
    // Minify after purging
    ...(process.env.NODE_ENV === 'production' ? [cssnano({ preset: 'default' })] : []),
  ],
};
