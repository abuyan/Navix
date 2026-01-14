'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
    content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // 自定义组件样式
                    h1: ({ node, ...props }) => (
                        <h1 className="text-3xl font-bold mt-8 mb-4" style={{ color: 'var(--color-text-primary)' }} {...props} />
                    ),
                    h2: ({ node, ...props }) => {
                        const text = props.children?.toString() || '';
                        const id = text
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '')
                            .replace(/-+/g, '-');
                        return (
                            <h2
                                id={id}
                                className="text-2xl font-bold mt-6 mb-3 scroll-mt-24"
                                style={{ color: 'var(--color-text-primary)' }}
                                {...props}
                            />
                        );
                    },
                    h3: ({ node, ...props }) => {
                        const text = props.children?.toString() || '';
                        const id = text
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '')
                            .replace(/-+/g, '-');
                        return (
                            <h3
                                id={id}
                                className="text-xl font-semibold mt-4 mb-2 scroll-mt-24"
                                style={{ color: 'var(--color-text-primary)' }}
                                {...props}
                            />
                        );
                    },
                    h4: ({ node, ...props }) => (
                        <h4 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }} {...props} />
                    ),
                    p: ({ node, ...props }) => (
                        <p className="my-4 leading-7" style={{ color: 'var(--color-text-secondary)' }} {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                        <strong className="font-bold" style={{ color: 'var(--color-text-primary)' }} {...props} />
                    ),
                    a: ({ node, ...props }) => (
                        <a
                            className="underline underline-offset-4 transition-colors opacity-80 hover:opacity-100"
                            style={{ color: 'var(--color-text-primary)' }}
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        />
                    ),
                    code: ({ node, inline, ...props }: any) => {
                        if (inline) {
                            return (
                                <code
                                    className="px-1.5 py-0.5 rounded text-sm font-mono"
                                    style={{
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                    {...props}
                                />
                            );
                        }
                        return <code {...props} />;
                    },
                    pre: ({ node, ...props }) => (
                        <pre
                            className="rounded-lg p-4 overflow-x-auto my-4"
                            style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)'
                            }}
                            {...props}
                        />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote
                            className="border-l-4 pl-4 my-4 italic"
                            style={{
                                borderColor: 'var(--color-border-hover)',
                                color: 'var(--color-text-tertiary)'
                            }}
                            {...props}
                        />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside my-4 space-y-2" style={{ color: 'var(--color-text-secondary)' }} {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal list-inside my-4 space-y-2" style={{ color: 'var(--color-text-secondary)' }} {...props} />
                    ),
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4">
                            <table
                                className="min-w-full divide-y"
                                style={{ borderColor: 'var(--color-border)' }}
                                {...props}
                            />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th
                            className="px-4 py-2 text-left font-semibold"
                            style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                color: 'var(--color-text-primary)',
                                borderColor: 'var(--color-border)'
                            }}
                            {...props}
                        />
                    ),
                    td: ({ node, ...props }) => (
                        <td
                            className="px-4 py-2"
                            style={{
                                color: 'var(--color-text-secondary)',
                                borderColor: 'var(--color-border)'
                            }}
                            {...props}
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
