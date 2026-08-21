export type Locale = 'en' | 'ar';

export function localeFromPath(pathname = window.location.pathname): Locale {
  return /^\/ar(?:\/|$)/.test(pathname) ? 'ar' : 'en';
}

export function localePath(locale: Locale) {
  return locale === 'ar' ? '/ar/' : '/';
}

export function pick(locale: Locale, english: string, arabic: string) {
  return locale === 'ar' ? arabic : english;
}

export function localizeProgressLabel(label: string, locale: Locale) {
  if (locale === 'en' || !label) return label;

  const exact: Record<string, string> = {
    'Reading file': 'قراءة الملف',
    'Reading image': 'قراءة الصورة',
    'Reading PDF': 'قراءة ملف PDF',
    'Preparing source': 'تجهيز المصدر',
    'Preparing slides': 'تجهيز الشرائح',
    'Generating slides': 'إنشاء الشرائح',
    Ready: 'جاهز',
  };

  if (exact[label]) return exact[label];

  const pdfPage = label.match(/^Rendering PDF · page (\d+) of (\d+)$/);
  if (pdfPage) return `معالجة PDF · الصفحة ${pdfPage[1]} من ${pdfPage[2]}`;

  const generatedSlide = label.match(/^Generating slide (\d+) of (\d+)$/);
  if (generatedSlide) return `إنشاء الشريحة ${generatedSlide[1]} من ${generatedSlide[2]}`;

  return label;
}

const ARABIC_ERRORS: Record<string, string> = {
  'This file is larger than 250 MB. Try exporting a lighter PDF or image.':
    'حجم الملف أكبر من 250 ميجابايت. جرّب تصدير ملف PDF أو صورة بحجم أصغر.',
  'Unsupported file. Upload a PDF, PNG, JPG, or WebP file.':
    'صيغة الملف غير مدعومة. ارفع ملف PDF أو PNG أو JPG أو WebP.',
  'This image could not be decoded. Try exporting it again as PNG or JPG.':
    'تعذّر قراءة هذه الصورة. جرّب تصديرها مرة أخرى بصيغة PNG أو JPG.',
  'This PDF could not be opened. It may be corrupt or password protected.':
    'تعذّر فتح ملف PDF. قد يكون تالفًا أو محميًا بكلمة مرور.',
  'Your browser could not create a rendering canvas.':
    'تعذّر على المتصفح إنشاء لوحة الرسم اللازمة لمعالجة الملف.',
  'Your browser could not create an export canvas.':
    'تعذّر على المتصفح إنشاء لوحة الرسم اللازمة للتصدير.',
  'Your browser could not create a padding canvas.':
    'تعذّر على المتصفح إنشاء لوحة الرسم اللازمة للهوامش.',
  'The browser could not encode one of the generated slides.':
    'تعذّر على المتصفح ترميز إحدى الشرائح الناتجة.',
  'No visual content could be read from this file.':
    'لم يتم العثور على محتوى بصري قابل للقراءة داخل الملف.',
};

export function localizeError(error: unknown, locale: Locale) {
  const fallback = locale === 'ar'
    ? 'حدث خطأ أثناء معالجة هذا الملف.'
    : 'Something went wrong while processing this file.';

  if (!(error instanceof Error)) return fallback;
  if (locale === 'en') return error.message;
  return ARABIC_ERRORS[error.message] ?? fallback;
}

export const CLIENT_META = {
  en: {
    title: 'Slicefolio — Website & PDF to Instagram Carousel Tool',
    description:
      'Slicefolio converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides for designers. Files are processed locally in your browser.',
    ogLocale: 'en_US',
  },
  ar: {
    title: 'Slicefolio — تحويل تصميمات المواقع وملفات PDF إلى كاروسيل إنستغرام',
    description:
      'حوّل تصميمات المواقع الطويلة وملفات PDF والصور إلى شرائح كاروسيل جاهزة لإنستغرام. تتم المعالجة محليًا داخل المتصفح دون رفع ملفاتك.',
    ogLocale: 'ar_AR',
  },
} as const;

export function applyLocaleToDocument(locale: Locale) {
  const meta = CLIENT_META[locale];
  const root = document.documentElement;
  root.lang = locale;
  root.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.title = meta.title;

  const setMeta = (selector: string, value: string) => {
    const element = document.querySelector<HTMLMetaElement>(selector);
    if (element) element.content = value;
  };

  setMeta('meta[name="description"]', meta.description);
  setMeta('meta[property="og:title"]', meta.title);
  setMeta('meta[property="og:description"]', meta.description);
  setMeta('meta[property="og:locale"]', meta.ogLocale);
  setMeta('meta[name="twitter:title"]', meta.title);
  setMeta('meta[name="twitter:description"]', meta.description);

  const alternate = document.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${locale}"]`,
  );
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');

  if (alternate?.href) {
    if (canonical) canonical.href = alternate.href;
    if (ogUrl) ogUrl.content = alternate.href;
  }
}
