import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HifiLanding } from '@/components/home/HifiLanding';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import {
  generateSoftwareApplicationSchema,
  generateFAQSchema,
} from '@/lib/seo/schema';
import { routing, type Locale } from '@/i18n/routing';

export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const tFaq = await getTranslations({ locale, namespace: 'faq' });
  const featureList = t.raw('featureList') as string[];
  const faqs = tFaq.raw('items') as { question: string; answer: string }[];

  return (
    <>
      <SchemaMarkup
        schema={[
          generateSoftwareApplicationSchema(locale as Locale, {
            description: t('schema.softwareDescription'),
            featureList,
          }),
          generateFAQSchema(faqs),
        ]}
      />
      <HifiLanding />
    </>
  );
}
