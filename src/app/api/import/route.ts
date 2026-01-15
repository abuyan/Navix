import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBookmarkHTML, isValidBookmarkHTML } from '@/lib/bookmark-parser';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const panelId = formData.get('panelId') as string | null;

        if (!file || !panelId) {
            return NextResponse.json(
                { error: '请选择书签文件并确认面板' },
                { status: 400 }
            );
        }

        // Verify panel ownership
        const panel = await prisma.panel.findUnique({
            where: { id: panelId }
        });

        if (!panel || (panel.userId !== session.user.id)) {
            return NextResponse.json({ error: '无权操作此面板' }, { status: 403 });
        }

        // 读取文件内容
        const html = await file.text();

        // 验证文件格式
        if (!isValidBookmarkHTML(html)) {
            return NextResponse.json(
                { error: '无效的书签文件格式，请上传浏览器导出的书签 HTML 文件' },
                { status: 400 }
            );
        }

        // 解析书签
        const parseResult = parseBookmarkHTML(html);

        if (parseResult.errors.length > 0) {
            return NextResponse.json(
                { error: parseResult.errors.join(', ') },
                { status: 400 }
            );
        }

        if (parseResult.totalBookmarks === 0) {
            return NextResponse.json(
                { error: '未在文件中找到有效书签' },
                { status: 400 }
            );
        }

        // 获取现有分类（仅限当前面板）
        const existingCategories = await prisma.category.findMany({
            where: { panelId }
        });
        const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c]));

        // 获取现有网站 URL，用于去重 (Scoped to User)
        const existingSites = await prisma.site.findMany({
            where: { userId: session.user.id },
            select: { url: true }
        });
        const existingUrls = new Set(existingSites.map(s => s.url.toLowerCase()));

        let importedCategories = 0;
        let importedSites = 0;
        let skippedSites = 0;

        // 获取当前最大 sortOrder
        const maxSortOrder = existingCategories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
        let currentSortOrder = maxSortOrder;

        // 导入每个分类
        for (const parsedCategory of parseResult.categories) {
            // 查找或创建分类
            let category = categoryMap.get(parsedCategory.name.toLowerCase());

            if (!category) {
                currentSortOrder += 1;
                category = await prisma.category.create({
                    data: {
                        name: parsedCategory.name,
                        sortOrder: currentSortOrder,
                        panelId,
                        userId: session.user.id
                    }
                });
                categoryMap.set(parsedCategory.name.toLowerCase(), category);
                importedCategories++;
            }

            // 导入书签
            for (const bookmark of parsedCategory.bookmarks) {
                // 跳过已存在的 URL
                if (existingUrls.has(bookmark.url.toLowerCase())) {
                    skippedSites++;
                    continue;
                }

                await prisma.site.create({
                    data: {
                        title: bookmark.title,
                        url: bookmark.url,
                        icon: null, // 忽略书签自带的低质图标，使用系统自动抓取
                        description: null,
                        categoryId: category.id,
                        userId: session.user.id
                    }
                });

                existingUrls.add(bookmark.url.toLowerCase());
                importedSites++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `导入完成！新增 ${importedCategories} 个分类，${importedSites} 个书签`,
            stats: {
                newCategories: importedCategories,
                importedSites,
                skippedSites,
                totalParsed: parseResult.totalBookmarks
            }
        });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json(
            { error: `导入失败: ${error instanceof Error ? error.message : '未知错误'}` },
            { status: 500 }
        );
    }
}
