import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// 获取 AI 配置
async function getAIConfigs() {
    const configs = await prisma.systemConfig.findMany({
        where: {
            key: {
                in: ['AI_MODEL', 'AI_BASE_URL', 'AI_API_KEY']
            }
        }
    });

    const configMap = configs.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

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
            signal: AbortSignal.timeout(3000) // 下载超时控制
        });

        if (!response.ok) return undefined;

        const buffer = await response.arrayBuffer();

        // 限制大小，防止数据库过大（100KB 绰绰有余）
        if (buffer.byteLength > 100 * 1024) return undefined;

        const contentType = response.headers.get('content-type') || 'image/x-icon';
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        return undefined;
    }
}

// 网页信息提取（包含标题、描述和图标）
async function fetchPageInfo(url: string): Promise<{ title?: string; description?: string; icon?: string }> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(2000) // 2秒超时，不影响 AI 识别体感
        });

        if (!response.ok) return {};

        const html = await response.text();

        // 1. 提取标题
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : undefined;

        // 2. 提取 meta description
        let description = undefined;
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
        if (descMatch) description = descMatch[1].trim();

        // 3. 提取图标 (Favicon)
        let iconUrl = undefined;
        const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
            html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);

        if (iconMatch) {
            iconUrl = iconMatch[1];
            // 处理相对路径
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
            // 兜底：尝试根目录的 favicon.ico
            try {
                const urlObj = new URL(url);
                iconUrl = `${urlObj.origin}/favicon.ico`;
            } catch { }
        }

        // 关键增强：将找到的 URL 转换为 Base64
        let iconBase64 = undefined;
        if (iconUrl) {
            iconBase64 = await fetchIconAsBase64(iconUrl);
        }

        return { title, description, icon: iconBase64 };
    } catch (error) {
        // console.error('Fetch page info error:', error);
        return {};
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { url, title: userProvidedTitle, description: userProvidedDescription } = body as {
            url: string;
            title?: string;
            description?: string
        };

        if (!url) {
            return NextResponse.json(
                { error: '请提供有效的 URL' },
                { status: 400 }
            );
        }

        // 标准化 URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const aiConfigs = await getAIConfigs();

        // 如果没有配置 API Key，返回基本推断
        if (!aiConfigs.apiKey) {
            return NextResponse.json({
                title: userProvidedTitle || new URL(url).hostname,
                description: '',
                tags: [],
                method: 'basic'
            });
        }

        const openai = new OpenAI({
            baseURL: aiConfigs.baseUrl,
            apiKey: aiConfigs.apiKey,
        });

        const prompt = `你是一个专业的网站信息整理助手。请根据以下信息返回精准的 JSON。

网站 URL: ${url}
用户填写的临时名称: ${userProvidedTitle || '未提供'}
用户填写的临时说明: ${userProvidedDescription || '未提供'}

任务：
1. 确定最简洁的“站点名称”：
   - 综合参考 URL、用户名称和说明。
   - **核心要求**：必须去掉冗余后缀，保留最纯粹的品牌或项目名。
2. 生成“站点说明”：
   - 使用简明扼要的中文。
   - 重点参考用户提供的说明（如果已提供），进行润色或精炼。
   - 长度严格控制在 15 个字以内。

请只返回 JSON（不要包含 markdown 代码块逻辑，不要包含任何解释）：
{
  "title": "精炼后的名称",
  "description": "15字以内的精炼说明"
}`;

        // 核心优化：并发执行 AI 推断和网页基础信息抓取 (图标发现)
        const [completion, pageInfo] = await Promise.all([
            openai.chat.completions.create({
                messages: [
                    { role: 'system', content: '你是一个专业的网站分析助手，擅长从网址中提取品牌名并生成精炼描述。' },
                    { role: 'user', content: prompt }
                ],
                model: aiConfigs.model,
                temperature: 0.4,
                max_tokens: 300,
            }),
            fetchPageInfo(url)
        ]);

        const content = completion.choices[0]?.message?.content || '';

        // 解析 AI 返回的 JSON
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
                title: userProvidedTitle || new URL(url).hostname,
                description: ''
            };
        }

        return NextResponse.json({
            ...result,
            icon: pageInfo.icon, // 将发现的真实图标返回
            url,
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
