import { getTranslations } from 'next-intl/server';
import { cn } from '@lib/utils';
import { richText } from '@third-ui/main/rich-text-expert';
import { FAQInteractive } from './faq-interactive';

interface FAQData {
  title: string;
  description: string;
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export async function FAQ({ 
  locale, 
  sectionClassName 
}: { 
  locale: string;
  sectionClassName?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'faq' });
  
  // Process translation data
  const rawItems = t.raw('items') as Array<{
    question: string;
    answer: string;
  }>;
  
  const data: FAQData = {
    title: t('title'),
    description: richText(t, 'description'),
    items: rawItems.map((item, index) => ({
      id: `faq-item-${index}`,
      question: item.question,
      answer: richText(t, `items.${index}.answer`)
    }))
  };

  return (
    <section id="faq" className={cn("px-16 py-10 mx-16 md:mx-32 scroll-mt-20", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {data.title}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-base md:text-lg mx-auto">
        {data.description}
      </p>
      <div className="space-y-6">
        {data.items.map((item) => (
          <div
            key={item.id}
            data-faq-id={item.id}
            className="bg-white dark:bg-gray-800/60 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition shadow-sm dark:shadow-none"
          >
            <button
              className="w-full flex items-center justify-between text-left focus:outline-none"
              data-faq-toggle={item.id}
              aria-expanded="false"
            >
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.question}</span>
              <svg 
                className="w-6 h-6 text-gray-400 ml-2 transition-transform duration-200" 
                data-faq-icon={item.id}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div 
              className="mt-4 text-gray-700 dark:text-gray-300 text-base hidden" 
              data-faq-content={item.id}
            >
              {item.answer}
            </div>
          </div>
        ))}
      </div>
      
      <FAQInteractive data={data} />
    </section>
  );
} 