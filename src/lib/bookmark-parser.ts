/**
 * 书签 HTML 文件解析器
 * 支持解析 Chrome、Edge、Firefox、Safari 等浏览器导出的 Netscape Bookmark HTML 格式
 */

export type ParsedBookmark = {
    title: string;
    url: string;
    icon?: string;
    addDate?: Date;
};

export type ParsedCategory = {
    name: string;
    bookmarks: ParsedBookmark[];
};

export type ParseResult = {
    categories: ParsedCategory[];
    totalBookmarks: number;
    errors: string[];
};

/**
 * 解析书签 HTML 文件内容
 */
export function parseBookmarkHTML(html: string): ParseResult {
    const result: ParseResult = {
        categories: [],
        totalBookmarks: 0,
        errors: []
    };

    try {
        // 使用正则表达式解析 HTML（在 Node.js 环境中无 DOMParser）
        // 匹配收藏夹结构：<DT><H3...>收藏夹名</H3> 后跟 <DL><p> 内容 </DL>

        // 首先提取所有书签链接及其父收藏夹
        const folderPattern = /<DT><H3[^>]*>([^<]+)<\/H3>\s*<DL><p>([\s\S]*?)<\/DL>/gi;
        const linkPattern = /<DT><A\s+HREF="([^"]+)"[^>]*(?:ICON="([^"]*)")?[^>]*>([^<]+)<\/A>/gi;

        // 查找顶级书签（不在收藏夹中的）
        const topLevelBookmarks: ParsedBookmark[] = [];

        // 递归解析收藏夹
        function parseFolderContent(content: string, folderName: string): ParsedCategory | null {
            const bookmarks: ParsedBookmark[] = [];

            // 提取该收藏夹内的所有链接
            let linkMatch;
            const linkRegex = /<DT><A\s+HREF="([^"]+)"(?:[^>]*ICON="([^"]*)")?[^>]*>([^<]+)<\/A>/gi;

            while ((linkMatch = linkRegex.exec(content)) !== null) {
                const url = linkMatch[1];
                const icon = linkMatch[2] || undefined;
                const title = linkMatch[3].trim();

                // 过滤无效 URL
                if (url && url.startsWith('http')) {
                    bookmarks.push({ title, url, icon });
                }
            }

            if (bookmarks.length > 0) {
                return { name: folderName, bookmarks };
            }
            return null;
        }

        // 解析所有顶级收藏夹
        let folderMatch;
        const processedContent = new Set<string>();

        while ((folderMatch = folderPattern.exec(html)) !== null) {
            const folderName = folderMatch[1].trim();
            const folderContent = folderMatch[2];

            // 跳过书签栏等特殊收藏夹的重复处理
            if (processedContent.has(folderContent)) continue;
            processedContent.add(folderContent);

            // 检查是否有子收藏夹
            const subFolderPattern = /<DT><H3[^>]*>([^<]+)<\/H3>\s*<DL><p>([\s\S]*?)<\/DL>/gi;
            let subMatch;
            let hasSubFolders = false;

            while ((subMatch = subFolderPattern.exec(folderContent)) !== null) {
                hasSubFolders = true;
                const subFolderName = subMatch[1].trim();
                const subContent = subMatch[2];

                const category = parseFolderContent(subContent, subFolderName);
                if (category) {
                    result.categories.push(category);
                    result.totalBookmarks += category.bookmarks.length;
                }
            }

            // 如果没有子收藏夹，直接解析该收藏夹
            if (!hasSubFolders) {
                const category = parseFolderContent(folderContent, folderName);
                if (category) {
                    result.categories.push(category);
                    result.totalBookmarks += category.bookmarks.length;
                }
            }
        }

        // 如果没有解析到任何分类，尝试直接解析所有链接到"未分类"
        if (result.categories.length === 0) {
            let linkMatch;
            const allLinksRegex = /<DT><A\s+HREF="([^"]+)"(?:[^>]*ICON="([^"]*)")?[^>]*>([^<]+)<\/A>/gi;
            const uncategorized: ParsedBookmark[] = [];

            while ((linkMatch = allLinksRegex.exec(html)) !== null) {
                const url = linkMatch[1];
                const icon = linkMatch[2] || undefined;
                const title = linkMatch[3].trim();

                if (url && url.startsWith('http')) {
                    uncategorized.push({ title, url, icon });
                }
            }

            if (uncategorized.length > 0) {
                result.categories.push({ name: '未分类书签', bookmarks: uncategorized });
                result.totalBookmarks = uncategorized.length;
            }
        }

    } catch (error) {
        result.errors.push(`解析错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return result;
}

/**
 * 验证是否为有效的书签 HTML 文件
 */
export function isValidBookmarkHTML(html: string): boolean {
    // Netscape Bookmark 文件应包含 DOCTYPE NETSCAPE-Bookmark-file 或 典型的 DL/DT 结构
    return (
        html.includes('NETSCAPE-Bookmark-file') ||
        (html.includes('<DL>') && html.includes('<DT>') && html.includes('HREF='))
    );
}
