import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

// 初始化 Notion 客户端
// 注意：在 Next.js 服务端组件中，process.env 是可以直接读取的
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// 初始化 Markdown 转换器
const n2m = new NotionToMarkdown({ notionClient: notion });

// 定义周刊文章的数据结构
export interface WeeklyPost {
  id: string;
  title: string;
  date: string;
  platforms: string[];
}

/**
 * 获取周刊文章列表
 */
export async function getWeeklyPosts(): Promise<WeeklyPost[]> {
  const databaseId = process.env.NOTION_WEEKLY_DB_ID;

  console.log('🔍 [Server] Fetching weekly posts...');
  console.log('   - Database ID:', databaseId ? 'Found' : 'MISSING');
  console.log('   - Token:', process.env.NOTION_TOKEN ? 'Found' : 'MISSING');

  if (!databaseId) {
    console.error('❌ NOTION_WEEKLY_DB_ID not found in environment variables');
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: '日期', 
          direction: 'descending',
        },
      ],
    });
    
    console.log(`✅ [Server] Fetched ${response.results.length} posts.`);

    const posts = response.results.map((page: any) => {
      // 提取标题
      const titleProp = page.properties['标题'];
      const title = titleProp?.title?.[0]?.plain_text || '无标题';

      // 提取日期
      const dateProp = page.properties['日期'];
      const date = dateProp?.date?.start || '未知日期';

      // 提取平台
      const platformProp = page.properties['平台'];
      const platforms = platformProp?.multi_select?.map((p: any) => p.name) || [];

      return {
        id: page.id,
        title,
        date,
        platforms,
      };
    });

    return posts;
  } catch (error) {
    console.error('❌ Failed to fetch weekly posts:', error);
    return [];
  }
}

/**
 * 获取单篇周刊的 Markdown 内容
 */
export async function getPostContent(pageId: string) {
  try {
    // 把 Notion Blocks 转为 Markdown Blocks
    const mdblocks = await n2m.pageToMarkdown(pageId);
    // 转为 Markdown 字符串
    const mdString = n2m.toMarkdownString(mdblocks);
    
    return mdString.parent; // 返回 Markdown 文本
  } catch (error) {
    console.error(`❌ Failed to fetch content for page ${pageId}:`, error);
    return '';
  }
}

/**
 * 获取单篇周刊的元数据
 */
export async function getPostMetadata(pageId: string): Promise<WeeklyPost | null> {
    try {
        const page: any = await notion.pages.retrieve({ page_id: pageId });
        
        const titleProp = page.properties['标题'];
        const title = titleProp?.title?.[0]?.plain_text || '无标题';
  
        const dateProp = page.properties['日期'];
        const date = dateProp?.date?.start || '未知日期';
  
        const platformProp = page.properties['平台'];
        const platforms = platformProp?.multi_select?.map((p: any) => p.name) || [];
  
        return {
          id: page.id,
          title,
          date,
          platforms,
        };
    } catch (error) {
        console.error(`❌ Failed to fetch metadata for page ${pageId}:`, error);
        return null;
    }
}
