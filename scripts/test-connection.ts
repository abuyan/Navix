const { Client } = require('@notionhq/client');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// 加载 .env.local 环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('🚀 开始连接测试...\n');

  // 1. 测试 DeepSeek 连接
  console.log('Testing DeepSeek API...');
  try {
    const openai = new OpenAI({
      baseURL: process.env.DEEPSEEK_BASE_URL,
      apiKey: process.env.DEEPSEEK_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "请用一句简短的中文向我打招呼，不要超过10个字。" }],
      model: "deepseek-chat",
    });

    console.log('✅ DeepSeek 连接成功! 回复:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ DeepSeek 连接失败:', error instanceof Error ? error.message : error);
  }

  console.log('\n-------------------\n');

  // 2. 测试 Notion 连接
  console.log('Testing Notion API...');
  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const databaseId = process.env.NOTION_DATABASE_ID;

    // --- DEBUG START ---
    console.log('DEBUG: notion keys:', Object.keys(notion));
    if (notion.databases) {
       console.log('DEBUG: notion.databases keys:', Object.keys(notion.databases));
       console.log('DEBUG: Type of query:', typeof notion.databases.query);
    } else {
       console.log('DEBUG: notion.databases is UNDEFINED');
    }
    // --- DEBUG END ---

    if (!databaseId) {
      throw new Error('Notion Database ID is missing in .env.local');
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1, 
    });

    console.log(`✅ Notion 连接成功!`);
    console.log(`   - 数据库中共有 ${response.results.length} 条数据`);
    
    if (response.results.length > 0) {
      const page = response.results[0];
      console.log(`   - 第一条数据的 ID: ${page.id}`);
    } else {
      console.log('   - 警告: 数据库是空的 (这很正常，只要没报错就行)');
    }

  } catch (error) {
    console.error('❌ Notion 连接失败:', error instanceof Error ? error.message : error);
    // 打印更详细的错误堆栈
    if (error instanceof Error && error.stack) console.error(error.stack);
  }
}

main();
