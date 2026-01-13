import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// 创建 OpenAI 客户端（使用 DeepSeek API）
const openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// 简单的网页标题提取（作为备选方案）
async function fetchPageInfo(url: string): Promise<{ title?: string; description?: string }> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(5000) // 5秒超时
        });

        const html = await response.text();

        // 提取标题
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : undefined;

        // 提取 meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const description = descMatch ? descMatch[1].trim() : undefined;

        return { title, description };
    } catch (error) {
        console.error('Fetch page info error:', error);
        return {};
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { url } = body as { url: string };

        if (!url) {
            return NextResponse.json(
                { error: '请提供有效的 URL' },
                { status: 400 }
            );
        }

        // 自动补全 URL 协议
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // 如果没有配置 API Key，使用简单抓取
        if (!process.env.DEEPSEEK_API_KEY) {
            const info = await fetchPageInfo(url);
            return NextResponse.json({
                title: info.title || new URL(url).hostname,
                description: info.description || '',
                tags: [],
                method: 'basic'
            });
        }

        // 1. 首先抓取网页基本信息
        const pageInfo = await fetchPageInfo(url);

        // 2. 使用 AI 智能分析
        const prompt = `你是一个网站分析助手。请分析以下网站信息，返回 JSON 格式的结果。

网站 URL: ${url}
网页标题: ${pageInfo.title || '未知'}
网页描述: ${pageInfo.description || '未知'}

请返回以下 JSON 格式（只返回 JSON，不要其他内容）：
{
  "title": "简洁的中文网站名称（如果原标题是英文，翻译成中文；如果太长，精简它）",
  "description": "一句话简介，不超过50字，说明这个网站/工具是做什么的",
  "tags": ["标签1", "标签2", "标签3"]
}

标签规则：
- 最多3个标签
- 每个标签2-4个字
- 常用标签示例：设计工具、开发工具、AI助手、效率提升、学习资源、在线工具等`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'deepseek-chat',
            temperature: 0.3,
            max_tokens: 500,
        });

        const content = completion.choices[0]?.message?.content || '';

        // 解析 AI 返回的 JSON
        let result: { title: string; description: string; tags: string[] };
        try {
            // 尝试提取 JSON（处理可能的 markdown 代码块）
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch {
            // 如果解析失败，返回基本信息
            result = {
                title: pageInfo.title || new URL(url).hostname,
                description: pageInfo.description || '',
                tags: []
            };
        }

        return NextResponse.json({
            ...result,
            url, // 返回标准化后的 URL
            method: 'ai'
        });

    } catch (error) {
        console.error('AI extract error:', error);
        return NextResponse.json(
            { error: `分析失败: ${error instanceof Error ? error.message : '未知错误'}` },
            { status: 500 }
        );
    }
}
