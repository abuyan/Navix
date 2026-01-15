import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// 获取 AI 配置 (优先使用用户私有配置)
async function getAIConfigs(userId?: string) {
    let configMap: Record<string, string> = {};

    // 1. 先尝试获取用户私有配置
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

    // 2. 如果缺少配置，从全局系统配置补充/回退
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

// 将图标 URL 转换为 Base64 字符串，确保持久化存储
async function fetchIconAsBase64(url: string): Promise<string | undefined> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) return undefined;

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 100 * 1024) return undefined;

        const contentType = response.headers.get('content-type') || 'image/x-icon';
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        return undefined;
    }
}

// 网页信息提取
async function fetchPageInfo(url: string): Promise<{ title?: string; description?: string; icon?: string }> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(2000)
        });

        if (!response.ok) return {};

        const html = await response.text();

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : undefined;

        let description = undefined;
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
        if (descMatch) description = descMatch[1].trim();

        let iconUrl = undefined;
        const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
            html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);

        if (iconMatch) {
            iconUrl = iconMatch[1];
            if (iconUrl && !iconUrl.startsWith('http')) {
                const urlObj = new URL(url);
                if (iconUrl.startsWith('//')) {
                    iconUrl = urlObj.protocol + iconUrl;
                } else if (iconUrl.startsWith('/')) {
                    iconUrl = urlObj.origin + iconUrl;
                } else {
                    iconUrl = urlObj.origin + '/' + iconUrl;
                }
            }
        } else {
            try {
                const urlObj = new URL(url);
                iconUrl = `${urlObj.origin}/favicon.ico`;
            } catch { }
        }

        let iconBase64 = undefined;
        if (iconUrl) {
            iconBase64 = await fetchIconAsBase64(iconUrl);
        }

        return { title, description, icon: iconBase64 };
    } catch (error) {
        return {};
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        const body = await request.json();
        const { url: inputUrl, title: userProvidedTitle, description: userProvidedDescription } = body as {
            url: string;
            title?: string;
            description?: string
        };

        if (!inputUrl) {
            return NextResponse.json(
                { error: '请提供有效的 URL' },
                { status: 400 }
            );
        }

        // 标准化 URL
        const normalizedUrl = (inputUrl.startsWith('http://') || inputUrl.startsWith('https://'))
            ? inputUrl
            : 'https://' + inputUrl;

        const aiConfig = await getAIConfigs(userId);

        if (!aiConfig.apiKey) {
            return NextResponse.json({
                title: userProvidedTitle || new URL(normalizedUrl).hostname,
                description: '',
                tags: [],
                method: 'basic'
            });
        }

        const openai = new OpenAI({
            baseURL: aiConfig.baseUrl,
            apiKey: aiConfig.apiKey,
        });

        const prompt = `你是一个专业的网站信息整理助手。请根据以下信息返回精准的 JSON。\n\n网站 URL: ${normalizedUrl}\n用户填写的临时名称: ${userProvidedTitle || '未提供'}\n用户填写的临时说明: ${userProvidedDescription || '未提供'}\n\n任务：\n1. 确定最简洁的“网站名称”：\n   - 综合参考 URL、用户名称和说明。\n   - **核心要求**：必须去掉冗余后缀，保留最纯粹的品牌或项目名。\n2. 生成“网页说明”：\n   - 使用简明扼要的中文。\n   - 重点参考用户提供的说明（如果已提供），进行润色或精炼。\n   - 长度严格控制在 15 个字以内。\n\n请只返回 JSON（不要包含 markdown 代码块逻辑，不要包含任何解释）：\n{\n  "title": "精炼后的名称",\n  "description": "15字以内的精炼说明"\n}`;

        const [completion, pageInfo] = await Promise.all([
            openai.chat.completions.create({
                messages: [
                    { role: 'system', content: '你是一个专业的网站分析助手，擅长从网址中提取品牌名并生成精炼描述。' },
                    { role: 'user', content: prompt }
                ],
                model: aiConfig.model,
                temperature: 0.4,
                max_tokens: 300,
            }),
            fetchPageInfo(normalizedUrl)
        ]);

        const content = completion.choices[0]?.message?.content || '';

        let result: { title: string; description: string };
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch (e) {
            result = {
                title: userProvidedTitle || new URL(normalizedUrl).hostname,
                description: ''
            };
        }

        return NextResponse.json({
            ...result,
            icon: pageInfo.icon,
            url: normalizedUrl,
            method: 'ai-fast'
        });

    } catch (error) {
        console.error('AI extract error:', error);
        return NextResponse.json(
            { error: `分析失败: ${error instanceof Error ? error.message : '未知错误'}` },
            { status: 500 }
        );
    }
}
