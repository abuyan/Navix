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

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        const body = await request.json();
        const { sites, categories } = body as {
            sites: { id: string, title: string, description: string }[],
            categories: { id: string, name: string }[]
        };

        if (!sites || sites.length === 0) {
            return NextResponse.json({ error: '没有需要分类的站点' }, { status: 400 });
        }
        if (!categories || categories.length === 0) {
            return NextResponse.json({ error: '没有可用分类' }, { status: 400 });
        }

        const aiConfig = await getAIConfigs(userId);

        if (!aiConfig.apiKey) {
            return NextResponse.json({ error: 'AI 服务未配置' }, { status: 400 });
        }

        const openai = new OpenAI({
            baseURL: aiConfig.baseUrl,
            apiKey: aiConfig.apiKey,
        });

        const categoryList = categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n');
        const siteList = sites.map(s => `- ID: ${s.id}\n  标题: ${s.title}\n  描述: ${s.description}`).join('\n\n');

        const prompt = `你是一个专业的书签整理助手。请根据以下现有的书签分类，为列表中的每个网站选择最合适的分类。

### 现有分类：
${categoryList}

### 待处理网站：
${siteList}

### 要求：
1. 仔细分析每个网站的标题和描述。
2. 从“现有分类”中选择一个最匹配的。
3. 如果没有特别匹配的，或者无法确定，请不要返回该网站的结果（保持原样）。
4. **重要：请使用 NDJSON (Newline Delimited JSON) 格式返回**。每行一个 JSON 对象。
5. STRICTLY JSON. NO MARKDOWN.
6. **CRITICAL: 返回的 \`categoryId\` 必须是分类的 ID字符串（如 "cmkg..."），绝对不能是分类名称！**

### 返回格式示例：
{"siteId": "site_id_123", "categoryId": "category_id_abc_NOT_NAME"}
{"siteId": "site_id_456", "categoryId": "category_id_xyz_NOT_NAME"}
`;

        console.log('--- AI Auto-Categorize Prompt ---');
        console.log(prompt);
        console.log('---------------------------------');

        const response = await openai.chat.completions.create({
            model: aiConfig.model,
            stream: true,
            messages: [
                { role: 'system', content: '你是一个专业的书签整理助手。请只返回 NDJSON 格式的数据。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1, // 低温度以保证准确性
            max_tokens: 2000,
        });

        // Pipe OpenAI Stream
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        process.stdout.write(content); // Log to server console
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }
                console.log('\n--- AI Response End ---');
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error) {
        console.error('AI Categorize error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
}
