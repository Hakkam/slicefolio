import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SITE_NAME = 'Slicefolio';
const SITE_DESCRIPTION =
  'Slicefolio converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides for designers. Files are processed locally in your browser.';
const PRODUCT_DEFINITION =
  'Slicefolio is a browser-based tool for UI/UX and web designers that converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides.';
const CREATOR_URL = 'https://hakkam.com';

function normalizeSiteUrl(value: string | undefined) {
  if (!value) return '';

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';

    const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
    return `${url.origin}${pathname}`;
  } catch {
    return '';
  }
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function createSeoPlugin(siteUrl: string): Plugin {
  const canonicalUrl = siteUrl ? `${siteUrl}/` : '';
  const ogImageUrl = siteUrl ? `${siteUrl}/og-image.png` : '/og-image.png';

  return {
    name: 'slicefolio-seo',

    transformIndexHtml(html) {
      const creator = {
        '@type': 'Person',
        '@id': `${CREATOR_URL}/#person`,
        name: 'Hakkam',
        url: CREATOR_URL,
      };

      const webApplication: Record<string, unknown> = {
        '@type': 'WebApplication',
        name: SITE_NAME,
        description: PRODUCT_DEFINITION,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
        creator: { '@id': creator['@id'] },
        featureList: [
          'Convert PDF, PNG, JPG, and WebP design files into Instagram carousel slides',
          'Portrait 4:5 output at 1080 × 1350',
          'Tall 3:4 output at 1080 × 1440',
          'Square 1:1 output at 1080 × 1080',
          'Local browser-based file processing',
          'Padding controls for all slides or selected slides',
          'Individual PNG or JPEG downloads and ZIP export',
        ],
      };

      const graph: Array<Record<string, unknown>> = [creator, webApplication];

      if (canonicalUrl) {
        webApplication['@id'] = `${canonicalUrl}#web-application`;
        webApplication.url = canonicalUrl;
        graph.unshift({
          '@type': 'WebSite',
          '@id': `${canonicalUrl}#website`,
          name: SITE_NAME,
          description: SITE_DESCRIPTION,
          url: canonicalUrl,
          inLanguage: 'en',
          creator: { '@id': creator['@id'] },
        });
      }

      const urlMetadata = canonicalUrl
        ? [
            `<link rel="canonical" href="${canonicalUrl}" />`,
            `<meta property="og:url" content="${canonicalUrl}" />`,
          ].join('\n    ')
        : '';

      const structuredData = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': graph,
      }).replaceAll('<', '\\u003c');

      return html
        .replace('<!-- slicefolio:url-metadata -->', urlMetadata)
        .replaceAll('__SLICEFOLIO_OG_IMAGE__', ogImageUrl)
        .replace(
          '<!-- slicefolio:structured-data -->',
          `<script type="application/ld+json">${structuredData}</script>`,
        );
    },

    generateBundle() {
      const robotsLines = ['User-agent: *', 'Allow: /'];
      if (canonicalUrl) {
        robotsLines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
      }

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `${robotsLines.join('\n')}\n`,
      });

      if (canonicalUrl) {
        const sitemap = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          '  <url>',
          `    <loc>${escapeXml(canonicalUrl)}</loc>`,
          '  </url>',
          '</urlset>',
          '',
        ].join('\n');

        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: sitemap,
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'SLICEFOLIO_');
  const siteUrl = normalizeSiteUrl(env.SLICEFOLIO_SITE_URL);

  return {
    plugins: [react(), createSeoPlugin(siteUrl)],
  };
});
