const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function main() {
  const databaseId = process.env.NOTION_WEEKLY_DB_ID;
  console.log(`🕵️  正在诊断数据库 ID: ${databaseId}`);

  try {
    // 1. 先尝试获取数据库本身的元数据 (Schema)
    console.log('1️⃣  正在读取数据库结构...');
    const db = await notion.databases.retrieve({ database_id: databaseId });
    console.log('✅ 数据库读取成功！');
    console.log('📋 现有字段列表 (Properties):');
    Object.keys(db.properties).forEach(key => {
      console.log(`   - "${key}" (${db.properties[key].type})`);
    });

    // 2. 尝试模拟页面中的查询
    console.log('\n2️⃣  正在模拟 getWeeklyPosts 查询...');
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: '日期', // 我们在代码里用了这个名字
          direction: 'descending',
        },
      ],
    });
    console.log(`✅ 查询成功！获取到 ${response.results.length} 条数据。`);

  } catch (error) {
    console.error('\n❌ 发生错误 (这就是 400 的原因):');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
  }
}

main();
