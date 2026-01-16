import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// 获取 AI 配置 (优先使用用户私有配置)
async function getAIConfigs(userId?: string) {
    let configMap: Record<string, string> = {};

    if (userId) {
        try {
            const userConfigs = await (prisma as any).userSetting.findMany({
                where: {
                    userId,
                    key: {
                        in: ['AI_MODEL', 'AI_BASE_URL', 'AI_API_KEY']
                    }
                }
            });
            userConfigs.forEach((c: { key: string; value: string }) => {
                configMap[c.key] = c.value;
            });
        } catch (err) {
            console.error('Failed to fetch user AI configs:', err);
        }
    }

    const keysToFetch = ['AI_MODEL', 'AI_BASE_URL', 'AI_API_KEY'].filter(k => !configMap[k]);
    if (keysToFetch.length > 0) {
        try {
            const globalConfigs = await (prisma as any).systemConfig.findMany({
                where: {
                    key: { in: keysToFetch }
                }
            });
            globalConfigs.forEach((c: { key: string; value: string }) => {
                configMap[c.key] = c.value;
            });
        } catch (err) {
            console.error('Failed to fetch global AI configs:', err);
        }
    }

    return {
        model: configMap['AI_MODEL'] || 'glm-4-flash',
        baseUrl: configMap['AI_BASE_URL'] || 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: configMap['AI_API_KEY'] || process.env.ZHIPU_API_KEY || process.env.DEEPSEEK_API_KEY
    };
}

// Helper to create a readable stream from an iterator/async iterator
function iteratorToStream(iterator: any) {
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next()
            if (done) {
                controller.close()
            } else {
                controller.enqueue(value)
            }
        },
    })
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        const body = await request.json();
        const { query, excludeUrls = [] } = body as { query: string, excludeUrls?: string[] };

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ error: '请提供更详细的描述' }, { status: 400 });
        }

        const aiConfig = await getAIConfigs(userId);

        if (!aiConfig.apiKey) {
            return NextResponse.json({ error: 'AI 服务未配置，请先在设置中配置 API Key' }, { status: 400 });
        }

        const openai = new OpenAI({
            baseURL: aiConfig.baseUrl,
            apiKey: aiConfig.apiKey,
        });

        const excludePrompt = excludeUrls.length > 0
            ? `\n\n注意：请确保推荐的站点不包含以下已推荐过的 URL：\n${excludeUrls.join('\n')}`
            : '';

        const prompt = `你是一个专业的互联网导航专家。根据用户的需求描述，精准推荐真实存在的优质网站。

用户需求：${query}${excludePrompt}

要求：
1. 返回 5-8 个站点信息。单次推荐严禁超过 8 个站点，以确保结果的精准性。
2. 确保网站 URL 是真实有效的且具有代表性。
3. 提供简洁的网站名称和 20 字以内的中文功能说明。
4. **重要：请使用 NDJSON (Newline Delimited JSON) 格式返回**。即每行一个独立的 JSON 对象，不要包含 JSON 数组的方括号 []，也不要包含任何 markdown 标记。

格式示例：
{"title": "Google", "url": "https://google.com", "description": "全球最大的搜索引擎"}
{"title": "GitHub", "url": "https://github.com", "description": "面向开源及私有软件项目的托管平台"}
`;

        const response = await openai.chat.completions.create({
            model: aiConfig.model,
            stream: true,
            messages: [
                { role: 'system', content: '你是一个专业的互联网导航专家。请只返回 NDJSON 格式的数据，不要输出任何其他内容。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        // Use a simple ReadableStream to pipe the OpenAI content
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('AI Discover error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
}
