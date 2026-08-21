import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SITE_NAME = 'Slicefolio';
const CREATOR_URL = 'https://hakkam.com';

const SEO = {
  en: {
    title: 'Slicefolio — Website & PDF to Instagram Carousel Tool',
    description:
      'Slicefolio converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides for designers. Files are processed locally in your browser.',
    productDefinition:
      'Slicefolio is a browser-based tool for UI/UX and web designers that converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides.',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
    featureList: [
      'Convert PDF, PNG, JPG, and WebP design files into Instagram carousel slides',
      'Portrait 4:5 output at 1080 × 1350',
      'Tall 3:4 output at 1080 × 1440',
      'Square 1:1 output at 1080 × 1080',
      'Local browser-based file processing',
      'Padding controls for all slides or selected slides',
      'Individual PNG or JPEG downloads and ZIP export',
    ],
  },
  ar: {
    title: 'Slicefolio — تحويل تصميمات المواقع وملفات PDF إلى كاروسيل إنستغرام',
    description:
      'حوّل تصميمات المواقع الطويلة وملفات PDF والصور إلى شرائح كاروسيل جاهزة لإنستغرام. تتم المعالجة محليًا داخل المتصفح دون رفع ملفاتك.',
    productDefinition:
      'Slicefolio أداة تعمل داخل المتصفح لمصممي UI/UX والويب، تحوّل تصميمات المواقع الكاملة وملفات PDF والصور الطويلة إلى شرائح كاروسيل جاهزة لإنستغرام.',
    browserRequirements: 'يتطلب متصفح ويب حديثًا مع تفعيل JavaScript.',
    featureList: [
      'تحويل ملفات PDF وصور PNG وJPG وWebP إلى شرائح كاروسيل لإنستغرام',
      'مقاس عمودي 4:5 بدقة 1080 × 1350',
      'مقاس 3:4 بدقة 1080 × 1440',
      'مقاس مربع 1:1 بدقة 1080 × 1080',
      'معالجة الملفات محليًا داخل المتصفح',
      'التحكم في الهوامش لكل الشرائح أو لشرائح محددة',
      'تنزيل PNG أو JPEG بشكل منفرد وتصدير التسلسل داخل ZIP',
    ],
  },
} as const;

type SeoLocale = keyof typeof SEO;

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

function pageUrl(siteUrl: string, locale: SeoLocale) {
  if (!siteUrl) return '';
  return locale === 'ar' ? `${siteUrl}/ar/` : `${siteUrl}/`;
}

function createSeoPlugin(siteUrl: string): Plugin {
  const ogImageUrl = siteUrl ? `${siteUrl}/og-image.png` : '/og-image.png';

  return {
    name: 'slicefolio-seo',

    transformIndexHtml(html) {
      const locale: SeoLocale = /<html[^>]+lang=["']ar["']/i.test(html) ? 'ar' : 'en';
      const copy = SEO[locale];
      const canonicalUrl = pageUrl(siteUrl, locale);
      const englishUrl = pageUrl(siteUrl, 'en');
      const arabicUrl = pageUrl(siteUrl, 'ar');
      const websiteId = siteUrl ? `${siteUrl}/#website` : undefined;
      const applicationId = siteUrl ? `${siteUrl}/#web-application` : undefined;

      const creator = {
        '@type': 'Person',
        '@id': `${CREATOR_URL}/#person`,
        name: 'Hakkam',
        url: CREATOR_URL,
      };

      const webApplication: Record<string, unknown> = {
        '@type': 'WebApplication',
        name: SITE_NAME,
        description: copy.productDefinition,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Any',
        browserRequirements: copy.browserRequirements,
        creator: { '@id': creator['@id'] },
        featureList: copy.featureList,
      };

      if (applicationId) {
        webApplication['@id'] = applicationId;
        webApplication.url = englishUrl;
      }

      const graph: Array<Record<string, unknown>> = [creator, webApplication];

      if (siteUrl && websiteId && applicationId && canonicalUrl) {
        graph.unshift({
          '@type': 'WebSite',
          '@id': websiteId,
          name: SITE_NAME,
          description: SEO.en.description,
          url: englishUrl,
          inLanguage: ['en', 'ar'],
          creator: { '@id': creator['@id'] },
        });

        graph.push({
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          name: copy.title,
          description: copy.description,
          url: canonicalUrl,
          inLanguage: locale,
          isPartOf: { '@id': websiteId },
          mainEntity: { '@id': applicationId },
        });
      }

      const urlMetadata = canonicalUrl
        ? [
            `<link rel="canonical" href="${canonicalUrl}" />`,
            `<meta property="og:url" content="${canonicalUrl}" />`,
          ].join('\n    ')
        : '';

      const languageAlternates = englishUrl && arabicUrl
        ? [
            `<link rel="alternate" hreflang="en" href="${englishUrl}" />`,
            `<link rel="alternate" hreflang="ar" href="${arabicUrl}" />`,
            `<link rel="alternate" hreflang="x-default" href="${englishUrl}" />`,
          ].join('\n    ')
        : '';

      const structuredData = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': graph,
      }).replaceAll('<', '\\u003c');

      return html
        .replace('<!-- slicefolio:url-metadata -->', urlMetadata)
        .replace('<!-- slicefolio:language-alternates -->', languageAlternates)
        .replaceAll('__SLICEFOLIO_OG_IMAGE__', ogImageUrl)
        .replace(
          '<!-- slicefolio:structured-data -->',
          `<script type="application/ld+json">${structuredData}</script>`,
        );
    },

    generateBundle() {
      const robotsLines = ['User-agent: *', 'Allow: /'];
      if (siteUrl) {
        robotsLines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
      }

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `${robotsLines.join('\n')}\n`,
      });

      if (siteUrl) {
        const urls = [pageUrl(siteUrl, 'en'), pageUrl(siteUrl, 'ar')];
        const sitemap = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls.flatMap((url) => [
            '  <url>',
            `    <loc>${escapeXml(url)}</loc>`,
            '  </url>',
          ]),
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
    build: {
      rollupOptions: {
        input: {
          en: 'index.html',
          ar: 'ar/index.html',
        },
      },
    },
  };
});
