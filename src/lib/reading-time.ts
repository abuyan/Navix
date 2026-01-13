/**
 * 计算阅读时间(分钟)
 * 中文: 每分钟约300-500字,取中间值400字
 * 英文: 每分钟约200-250词,取中间值225词
 * 代码块: 每分钟约100行
 */
export function calculateReadingTime(content: string): number {
    // 移除 frontmatter
    const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---/, '');

    // 统计中文字符
    const chineseChars = (contentWithoutFrontmatter.match(/[\u4e00-\u9fa5]/g) || []).length;

    // 统计英文单词
    const englishWords = (contentWithoutFrontmatter.match(/[a-zA-Z]+/g) || []).length;

    // 统计代码块行数
    const codeBlocks = contentWithoutFrontmatter.match(/```[\s\S]*?```/g) || [];
    const codeLines = codeBlocks.reduce((total, block) => {
        return total + (block.match(/\n/g) || []).length;
    }, 0);

    // 计算阅读时间
    const chineseTime = chineseChars / 400;  // 中文400字/分钟
    const englishTime = englishWords / 225;   // 英文225词/分钟
    const codeTime = codeLines / 100;         // 代码100行/分钟

    const totalMinutes = chineseTime + englishTime + codeTime;

    // 至少1分钟
    return Math.max(1, Math.ceil(totalMinutes));
}

/**
 * 格式化阅读时间显示
 */
export function formatReadingTime(minutes: number): string {
    if (minutes < 1) {
        return '少于1分钟';
    } else if (minutes === 1) {
        return '1分钟';
    } else {
        return `${minutes}分钟`;
    }
}
