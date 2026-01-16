
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Reuse config logic (should be refactored into a shared util ideally)
async function getAIConfigs(userId?: string) {
    let configMap: Record<string, string> = {};

    if (userId) {
        try {
            const userConfigs = await (prisma as any).userSetting.findMany({
                where: {
                    userId,
                    key: { in: ['AI_MODEL', 'AI_BASE_URL', 'AI_API_KEY'] }
                }
            });
            userConfigs.forEach((c: { key: string; value: string }) => {
                configMap[c.key] = c.value;
            });
        } catch (err) { }
    }

    const keysToFetch = ['AI_MODEL', 'AI_BASE_URL', 'AI_API_KEY'].filter(k => !configMap[k]);
    if (keysToFetch.length > 0) {
        try {
            const globalConfigs = await (prisma as any).systemConfig.findMany({
                where: { key: { in: keysToFetch } }
            });
            globalConfigs.forEach((c: { key: string; value: string }) => {
                configMap[c.key] = c.value;
            });
        } catch (err) { }
    }

    return {
        model: configMap['AI_MODEL'] || 'glm-4-flash',
        baseUrl: configMap['AI_BASE_URL'] || 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: configMap['AI_API_KEY'] || process.env.ZHIPU_API_KEY
    };
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const body = await request.json();
        const { categories } = body as { categories: string[] };

        if (!categories || categories.length === 0) {
            return NextResponse.json({ icons: {} });
        }

        const aiConfig = await getAIConfigs(userId);
        if (!aiConfig.apiKey) {
            return NextResponse.json({ error: 'AI config missing' }, { status: 500 });
        }

        const openai = new OpenAI({
            baseURL: aiConfig.baseUrl,
            apiKey: aiConfig.apiKey,
        });

        const prompt = `
你是一个 UI 设计师。请为以下分类名称匹配最合适的 Lucide React 图标名称。
分类列表：${JSON.stringify(categories)}

要求：
1. 返回一个 JSON 对象，键是分类名称，值是 Lucide icon 名称（必须是 PascalCase，例如 "Home", "Settings", "Book"）。
2. 确保只使用 Lucide React 库中存在的标准图标。
3. 如果分类含义不明确，请随机分配一个视觉美观的通用图标（如 "Zap", "Star", "Circle", "Disc", "Square", "Triangle" 等），不要全部重复。
4. 不需要任何解释，只返回 JSON。
`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an icon matching assistant.' },
                { role: 'user', content: prompt }
            ],
            model: aiConfig.model,
            temperature: 0.7,
        });

        let content = completion.choices[0]?.message?.content || '{}';
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        let icons = {};
        try {
            icons = JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse AI icon response:', content);
        }

        return NextResponse.json({ icons });

    } catch (error) {
        console.error('AI icon error:', error);
        return NextResponse.json({ error: 'Failed to generate icons' }, { status: 500 });
    }
}
