const { Client } = require('@notionhq/client');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 1. 初始化环境
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function main() {
  console.log('🕵️  开始扫描 Notion 数据库...');

  try {
    // 2. 从 Notion 筛选数据
    const databaseId = process.env.NOTION_DATABASE_ID;
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "周刊",
        checkbox: {
          equals: true,
        },
      },
    });

    const items = response.results;
    console.log(`✅ 发现 ${items.length} 条待发布内容.\n`);

    if (items.length === 0) {
      console.log('⚠️ 没有找到勾选了“周刊”的内容，请检查 Notion 设置。');
      return;
    }

    // 3. 提取关键信息
    const materials = items.map((page, index) => {
      let title = "未命名";
      const titleProp = Object.values(page.properties).find(p => p.type === 'title');
      if (titleProp && titleProp.title.length > 0) {
        title = titleProp.title.map(t => t.plain_text).join('');
      }

      let url = "无链接";
      const urlProp = Object.values(page.properties).find(p => p.type === 'url');
      if (urlProp && urlProp.url) {
        url = urlProp.url;
      }
      return `${index + 1}. ${title} - ${url}`;
    }).join('\n');

    console.log('🤖 正在请求 DeepSeek 生成【去AI味・多端版】周刊文案...');

    const promptText = `
你是一位有10年经验的资深互联网产品经理，名字叫阿布。你正在写这一期的《Navix Weekly》。
请根据以下素材，写出两个版本的文案。

【核心原则 - 拒绝AI味】：
1. **说人话**：禁止使用“综上所述”、“让我们拭目以待”、“关键里程碑”等套话。
2. **主观视角**：多用“我发现”、“这让我想到”、“说白了”等第一人称口语。

【素材列表】：
${materials}

【任务要求】：
请输出以下两个部分，Markdown格式：

### 第一部分：网站/博客版 (详细版)
- **标题**：起一个科技媒体风标题。
- **导语**：老朋友聊天口吻。
- **正文**：素材点评，讲透价值。

### 第二部分：小红书版 (极简种草)
- **风格**：情绪化、多用 emoji、分段极短。
- **标题**：吸引眼球的二极管标题。

请直接输出 Markdown，不要解释。
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: promptText }],
      model: "deepseek-chat",
      temperature: 1.3,
    });

    const content = completion.choices[0].message.content;

    // ... (中间保存文件的代码不变)

    try {
        const newPage = await notion.pages.create({
            parent: { database_id: targetDbId },
            properties: {
                "标题": { title: [{ text: { content: title } }] },
                "日期": { date: { start: today } },
                "平台": { 
                    multi_select: [
                        { name: "网站" },
                        { name: "小红书" }
                    ] 
                }
            },
            children: blocks.slice(0, 100)
        });
        console.log(`🎉 成功写入 Notion! 页面 ID: ${newPage.id}`);
        console.log(`🔗 在 Notion 中查看: ${newPage.url}`);
    } catch (notionError) {
        console.error('❌ 写入 Notion 失败:', notionError.body || notionError);
    }

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

main();