import { getPostContent, getPostMetadata } from '@/lib/notion';
import WeeklySidebarWrapper from '@/components/WeeklySidebarWrapper';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const revalidate = 3600; // 每小时 ISR

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WeeklyPostPage({ params }: PageProps) {
  const { id } = await params;
  const metadata = await getPostMetadata(id);
  const content = await getPostContent(id);

  if (!metadata) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-secondary)]">
        文章不存在或无法加载
      </div>
    );
  }

  // 临时模拟的周刊侧边栏数据
  const weeklyCategories = [
    { id: '2026', name: '2026年存档', icon: 'calendar' },
    { id: '2025', name: '2025年存档', icon: 'calendar' },
    { id: 'featured', name: '精选内容', icon: 'sparkles' },
    { id: 'ai', name: 'AI 趋势', icon: 'zap' },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <WeeklySidebarWrapper
        categories={weeklyCategories}
        defaultActiveId="2026"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />

        <main className="flex-1 p-6 md:p-8 pt-24 max-w-4xl mx-auto w-full">
          {/* Back Button */}
          <Link
            href="/weekly"
            className="inline-flex items-center text-sm text-[var(--color-text-tertiary)] hover:text-blue-500 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 返回周刊列表
          </Link>

          {/* Article Header */}
          <header className="mb-10 pb-8 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-tertiary)] mb-4">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                {metadata.date}
              </span>
              <span>•</span>
              <div className="flex gap-2">
                {metadata.platforms.map(p => (
                  <span key={p} className="text-[var(--color-text-secondary)]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {metadata.title}
            </h1>
          </header>

          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:text-[var(--color-text-primary)]
            prose-p:text-[var(--color-text-secondary)] prose-p:leading-relaxed
            prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[var(--color-text-primary)]
            prose-li:text-[var(--color-text-secondary)]
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-[var(--color-bg-tertiary)] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
            ">
            <ReactMarkdown>
              {content}
            </ReactMarkdown>
          </article>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-[var(--color-border)] text-center text-[var(--color-text-tertiary)]">
            <p>感谢阅读本期 Navix Weekly 👋</p>
          </div>
        </main>
      </div>
    </div>
  );
}
