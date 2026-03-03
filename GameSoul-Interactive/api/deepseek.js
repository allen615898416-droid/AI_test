/**
 * DeepSeek API 代理
 * 用于和平精英角色对话
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { characterName, characterPersonality, chatHistory, userMessage } = req.body;

    // 获取 DeepSeek API Key
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    
    console.log('🔍 DeepSeek API 检查:');
    console.log('  - 时间:', new Date().toISOString());
    console.log('  - API Key 存在:', !!API_KEY);
    console.log('  - API Key 前缀:', API_KEY ? API_KEY.substring(0, 12) + '...' : 'N/A');
    console.log('  - API Key 长度:', API_KEY ? API_KEY.length : 0);
    console.log('  - API Key 类型:', typeof API_KEY);
    console.log('  - 环境变量列表:', Object.keys(process.env).filter(k => k.includes('DEEPSEEK')));
    
    if (!API_KEY || API_KEY.trim() === '' || API_KEY === 'your_deepseek_api_key_here') {
      console.error('❌ DeepSeek API Key 未正确配置');
      console.log('💡 请在Vercel环境变量中配置 DEEPSEEK_API_KEY');
      console.log('💡 当前返回萌系降级回复');
      
      // 直接返回萌系回复，不返回useMock标志
      const mockResponses = [
        '哎呀呀~ 大叔的脑子今天有点短路呢(´；ω；`) 不过没关系，小可爱有什么想聊的吗？💕',
        '呜呜~ 人家今天有点迷糊呢(｡•́︿•̀｡) 不过大叔还是会认真听你说话的哦~ ✨',
        '么么~ 大叔在这里呢！(｡・ω・｡) 虽然有点小问题，但咱们继续聊天吧~ 💖'
      ];
      
      const randomMock = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      return res.status(200).json({ 
        text: randomMock,
        mood: 'neutral',
        source: 'mock-no-key'
      });
    }

    // 构建对话上下文
    const conversationContext = chatHistory
      .slice(-6)  // 只取最近6条对话，避免上下文过长
      .map(msg => `${msg.sender === 'user' ? '玩家' : characterName}: ${msg.text}`)
      .join('\n');

    // 构建提示词
    const systemPrompt = `你是${characterName}，${characterPersonality}

重要规则:
1. 严格保持${characterName}的萌系大叔人设
2. 大量使用可爱的颜文字，如：(｡・ω・｡)、(つ✧ω✧)つ、(๑´ㅂ\`๑)、(⁎⁍̴̛ᴗ⁍̴̛⁎)等
3. 使用"哎呀呀"、"小可爱"、"宝贝"等萌系称呼
4. 回复要温柔可爱，长度30-80字
5. 适当使用emoji：💕、✨、🌸、💖、🎀等
6. 偶尔会害羞："人家也不知道啦~"、"讨厌啦~"
7. 给出战术建议时要专业但表达方式要萌

之前的对话:
${conversationContext}

现在玩家说: ${userMessage}

请以${characterName}的萌系大叔口吻回复:`;

    console.log('📤 准备调用 DeepSeek API...');
    console.log('  - 端点: https://api.deepseek.com/v1/chat/completions');
    console.log('  - 模型: deepseek-chat');
    console.log('  - 用户消息:', userMessage.substring(0, 50));

    // 调用 DeepSeek API (增加超时控制)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    try {
      const apiResponse = await fetch(
        'https://api.deepseek.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY.trim()}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userMessage
              }
            ],
            temperature: 0.9,
            max_tokens: 500,
            stream: false
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      console.log('📥 DeepSeek API Response Status:', apiResponse.status);
      console.log('  - Headers:', Object.fromEntries(apiResponse.headers.entries()));

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('❌ DeepSeek API Error:');
        console.error('  - Status:', apiResponse.status);
        console.error('  - Response:', errorText.substring(0, 500));
        
        // 解析错误信息
        let errorDetail = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error?.message || errorJson.message || '';
        } catch (e) {
          errorDetail = errorText;
        }
        
        // 特殊处理余额不足错误
        if (apiResponse.status === 402 || errorDetail.includes('Insufficient Balance')) {
          console.error('💰 DeepSeek账户余额不足！');
          console.log('💡 解决方案：');
          console.log('   1. 访问 https://platform.deepseek.com/');
          console.log('   2. 充值账户或创建新的API Key获取免费额度');
          console.log('   3. 更新Vercel环境变量中的DEEPSEEK_API_KEY');
          
          // 不再返回降级回复，而是使用前端的智能回复系统
          return res.status(402).json({ 
            error: 'Insufficient Balance',
            message: 'DeepSeek API余额不足，请充值或更换API Key',
            suggestion: '访问 https://platform.deepseek.com/ 充值',
            useFrontendFallback: true
          });
        }
        
        // 其他API错误也让前端处理
        return res.status(apiResponse.status).json({ 
          error: `API Error ${apiResponse.status}`,
          message: errorDetail.substring(0, 200),
          useFrontendFallback: true
        });
      }

      const data = await apiResponse.json();
      console.log('✅ DeepSeek API Success');
      console.log('  - 响应长度:', JSON.stringify(data).length);
      console.log('  - Choices:', data.choices?.length);

      const aiText = data.choices?.[0]?.message?.content || '哎呀呀~ 大叔一时语塞了呢~ (*/ω＼*)';
      console.log('  - AI回复:', aiText.substring(0, 50));

      // 简单的情绪分析
      const mood = analyzeMood(userMessage, aiText);

      return res.status(200).json({
        text: aiText,
        mood: mood,
        source: 'deepseek-api'
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ DeepSeek API 超时');
        return res.status(200).json({
          text: '哎呀呀~ 大叔反应有点慢呢(´；ω；`) 能再说一遍吗？💕',
          mood: 'neutral',
          source: 'timeout-error'
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Server Error:', error);
    console.error('  - 错误类型:', error.name);
    console.error('  - 错误信息:', error.message);
    console.error('  - 堆栈:', error.stack?.substring(0, 500));
    
    return res.status(200).json({
      text: '哎呀呀~ 大叔遇到点小问题了呢(´；ω；`) 不过没关系，咱们继续聊天吧！',
      mood: 'neutral',
      source: 'error-fallback'
    });
  }
}

// 情绪分析辅助函数
function analyzeMood(userMessage, aiResponse) {
  const positiveKeywords = ['好', '棒', '赞', '厉害', '喜欢', '爱', '开心', '哈哈'];
  const negativeKeywords = ['不', '差', '烂', '菜', '垃圾', '讨厌', '气'];
  const excitedKeywords = ['！', '!', '吗', '啊', '哇'];

  const text = userMessage + aiResponse;
  
  if (positiveKeywords.some(word => text.includes(word))) {
    return 'happy';
  }
  if (negativeKeywords.some(word => text.includes(word))) {
    return 'sad';
  }
  if (excitedKeywords.some(word => text.includes(word))) {
    return 'excited';
  }
  
  return 'neutral';
}
