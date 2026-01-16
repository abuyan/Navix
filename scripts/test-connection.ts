import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

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
}

main();

export { };
