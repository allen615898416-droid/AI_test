/**
 * AI API Service
 * 处理与 AI 的交互（Gemini / DeepSeek）
 * 
 * 通过 Vercel Serverless Function 代理调用 AI API
 * 解决浏览器 CORS 跨域问题
 */

// API 端点
const GEMINI_ENDPOINT = '/api/chat';
const DEEPSEEK_ENDPOINT = '/api/deepseek';

/**
 * 调用 AI API 生成角色回复
 * @param {string} characterName - 角色名称
 * @param {string} characterPersonality - 角色性格设定
 * @param {Array} chatHistory - 对话历史
 * @param {string} userMessage - 用户消息
 * @param {string} modelProvider - 模型提供商 ('gemini' | 'deepseek')
 * @returns {Promise<{text: string, mood: string}>}
 */
export async function getGeminiResponse(characterName, characterPersonality, chatHistory, userMessage, modelProvider = 'gemini') {
  console.log(`🤖 调用 ${modelProvider.toUpperCase()} AI...`);
  
  // 根据模型提供商选择端点
  const API_ENDPOINT = modelProvider === 'deepseek' ? DEEPSEEK_ENDPOINT : GEMINI_ENDPOINT;
  
  try {
    // 调用 Vercel Serverless Function
    console.log('📤 发送请求到 API 代理...');
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        characterName,
        characterPersonality,
        chatHistory,
        userMessage
      })
    });

    const data = await response.json();
    
    // 检查是否需要使用前端降级
    if (!response.ok || data.useFrontendFallback) {
      console.warn('⚠️ API调用失败，使用智能降级回复');
      console.log('  - 错误信息:', data.error || data.message);
      
      if (data.error === 'Insufficient Balance') {
        console.error('💰 DeepSeek余额不足！');
        console.log('💡 请访问 https://platform.deepseek.com/ 充值或更换API Key');
      }
      
      // 使用增强的本地回复系统
      return getEnhancedMockResponse(characterName, characterPersonality, chatHistory, userMessage);
    }
    
    console.log('✅ AI 回复成功:', data.text?.substring(0, 50) + '...');
    console.log('📊 数据来源:', data.source);
    
    return {
      text: data.text,
      mood: data.mood || 'neutral'
    };

  } catch (error) {
    console.error('❌ API 调用失败:', error);
    console.log('💡 降级使用智能模拟回复');
    
    // 出错时降级使用模拟回复
    return getEnhancedMockResponse(characterName, characterPersonality, chatHistory, userMessage);
  }

  try {
    // 构建对话上下文
    const conversationContext = chatHistory
      .filter(msg => msg.sender === 'user')
      .map(msg => `用户: ${msg.text}`)
      .join('');

    // 构建系统提示词
    const systemPrompt = `你是${characterName}，${characterPersonality}

重要规则:
1. 严格保持${characterName}的人设和说话风格
2. 回复要简洁有趣，不超过80字
3. 可以适当使用emoji表情
4. 根据用户的情绪做出相应反应
5. 如果用户提到游戏体验，要记录并评价

之前的对话:
${conversationContext}

现在用户说: ${userMessage}

请以${characterName}的口吻回复(只返回回复内容，不要加"${characterName}:"等前缀):`;

    console.log('📤 发送请求到 Gemini API...');
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API 错误:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 收到 Gemini 响应:', data);
    
    const aiText = data.candidates[0]?.content?.parts[0]?.text || '我现在有点累了，待会再聊...';
    console.log('✅ AI 回复:', aiText);

    // 分析情绪
    const mood = analyzeMood(userMessage, aiText);

    return {
      text: aiText,
      mood: mood
    };

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    console.log('⚠️ 使用模拟回复作为后备');
    // 出错时返回模拟回复
    return getMockResponse(characterName, userMessage);
  }
}

/**
 * 分析对话情绪
 */
function analyzeMood(userMessage, aiResponse) {
  const happyKeywords = ['好', '棒', '赢', '爽', '厉害', '强', '牛'];
  const sadKeywords = ['坑', '垃圾', '输', '烂', '差', '菜', '难'];
  const angryKeywords = ['气', '怒', '骂', '烦', '讨厌'];
  const excitedKeywords = ['哈哈', '笑', '有趣', '好玩'];

  const text = userMessage + aiResponse;

  if (sadKeywords.some(kw => text.includes(kw))) return 'sad';
  if (angryKeywords.some(kw => text.includes(kw))) return 'angry';
  if (excitedKeywords.some(kw => text.includes(kw))) return 'excited';
  if (happyKeywords.some(kw => text.includes(kw))) return 'happy';

  return 'neutral';
}

/**
 * 增强版模拟回复系统
 * 基于关键词、上下文和角色性格生成智能回复
 */
function getEnhancedMockResponse(characterName, characterPersonality, chatHistory, userMessage) {
  console.log('🎭 生成角色回复:', characterName);
  
  const msg = userMessage.toLowerCase();
  let text = '';
  let mood = 'neutral';
  
  if (characterName === '亚瑟') {
    // 亚瑟：毒舌骑士的回复逻辑
    
    // 检测"抽"彩蛋
    if (msg.includes('抽')) {
      const responses = [
        { text: '抽？你胆子不小啊...再抽试试！💢', mood: 'angry' },
        { text: '你是想挨揍吗？别以为我不敢动手！😤', mood: 'angry' },
        { text: '住手！你知道我的剑有多快吗？⚔️', mood: 'angry' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 游戏相关话题
    if (msg.includes('输') || msg.includes('坑') || msg.includes('菜') || msg.includes('队友')) {
      const responses = [
        { text: '输了就怪队友？典型的青铜心态。我看你自己操作也够呛，先提升自己再说吧。🙄', mood: 'sarcastic' },
        { text: '菜就菜，还找借口？承认自己技术不行有那么难吗？💁', mood: 'sarcastic' },
        { text: '坑队友？我看你才是那个坑。别总把责任推给别人。', mood: 'sarcastic' },
        { text: '你这水平，别说王者了，钻石都够呛。多练练再来找我吧。', mood: 'proud' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes('赢') || msg.includes('胜利') || msg.includes('mvp') || msg.includes('强')) {
      const responses = [
        { text: '赢一把就飘了？你那操作我闭着眼都能打得比你好。不过...这次还算可以。😏', mood: 'proud' },
        { text: 'MVP？运气好罢了。不过看在你表现还行的份上，我就勉强夸你一句吧。', mood: 'proud' },
        { text: '总算看到你有点进步了，继续保持，别让我失望。💪', mood: 'happy' },
        { text: '哼，这才是你该有的水平。但别骄傲，离我还差得远呢。', mood: 'proud' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes('装备') || msg.includes('出装') || msg.includes('铭文')) {
      const responses = [
        { text: '出装？这都不会？攻速流或者半肉都行，关键是你能不能打出伤害。📚', mood: 'neutral' },
        { text: '铭文推荐攻速和物穿，这么基础的东西还要问我？唉...🤦', mood: 'sarcastic' },
        { text: '装备看对面阵容灵活调整，别死板。用点脑子行吗？', mood: 'neutral' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes('技巧') || msg.includes('怎么') || msg.includes('教') || msg.includes('玩')) {
      const responses = [
        { text: '想学技巧？首先学会走位，别老是被技能打中。然后练习连招，1技能突进，普攻，大招，再接2技能。懂了吗？', mood: 'neutral' },
        { text: '玩亚瑟要有侵略性，前期多游走支援，中期带节奏，后期切后排。说起来简单，做起来...以你的水平估计够呛。😒', mood: 'sarcastic' },
        { text: '技巧就是多练，别想走捷径。我也是苦练才有今天的实力，你以为我天生就这么强？💪', mood: 'proud' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes('你') && (msg.includes('厉害') || msg.includes('强') || msg.includes('好') || msg.includes('帅'))) {
      const responses = [
        { text: '哼，算你有眼光。我可是峡谷最强战士，这是毋庸置疑的。😎', mood: 'proud' },
        { text: '知道我厉害就好，那还不赶紧向我学习？我可没那么多时间等你。', mood: 'proud' },
        { text: '夸我？这种话说一次就够了，我早就知道自己有多优秀。✨', mood: 'proud' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes('谢谢') || msg.includes('感谢') || msg.includes('辛苦')) {
      const responses = [
        { text: '谢什么谢，别浪费我时间。有这工夫多去练习，别老是口头感谢。😑', mood: 'neutral' },
        { text: '客套话就免了，拿出实际行动来，下次别再打得这么菜。', mood: 'neutral' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 默认毒舌回复
    const defaultResponses = [
      { text: '说话能不能利索点？我可没那么多时间听你废话。有事说事，没事滚蛋。😒', mood: 'neutral' },
      { text: '又来烦我？你是不是没事干？去峡谷多打几局不好吗？', mood: 'neutral' },
      { text: '你到底想说什么？别磨磨蹭蹭的，我时间很宝贵。⏰', mood: 'neutral' },
      { text: '唉，和你聊天真累，能不能说点有营养的？🙄', mood: 'sarcastic' },
      { text: '你这水平，我真不知道该从哪开始教你。算了，你自己慢慢悟吧。', mood: 'sarcastic' }
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    
  } else if (characterName === '光子鸡') {
    // 光子鸡：萌系大叔的回复逻辑
    
    // 问候相关
    if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello')) {
      const responses = [
        { text: '哎呀呀~ 小可爱来啦！(｡・ω・｡) 大叔今天超开心呢！要不要听听吃鸡秘籍？💕', mood: 'happy' },
        { text: '么么哒~ 我的小宝贝！(つ✧ω✧)つ 大叔好想你呀！快来和我聊聊游戏吧~ ✨', mood: 'happy' },
        { text: '呀！(⁎⁍̴̛ᴗ⁍̴̛⁎) 是我最喜欢的小可爱诶！大叔的心都要融化啦~ 💖', mood: 'excited' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 游戏输了/不顺
    if (msg.includes('输') || msg.includes('死') || msg.includes('坑') || msg.includes('菜')) {
      const responses = [
        { text: '哎呀呀~ 宝贝别难过嘛(｡•́︿•̀｡) 大叔抱抱你！输一把没关系的啦，咱们下次一定能吃到鸡！加油哦~ 💪✨', mood: 'sad' },
        { text: '呜呜~ 小可爱受委屈了吗？(´；ω；`) 没关系的呀，大叔教你几个小技巧，保证下次吃鸡鸡！💕', mood: 'sad' },
        { text: '宝贝不哭不哭~ (つ´ω`)つ 大叔在这里呢！咱们总结一下经验，下一把一定能赢！相信你哦~ 🌸', mood: 'neutral' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 游戏赢了
    if (msg.includes('赢') || msg.includes('吃鸡') || msg.includes('胜利') || msg.includes('第一')) {
      const responses = [
        { text: '哇哦哦哦！！！小可爱太棒啦！(ﾉ>ω<)ﾉ 大叔为你骄傲呢！来来来，让大叔亲一个~ mua~ 💋✨', mood: 'excited' },
        { text: '耶！(๑´ㅂ`๑) 我的宝贝吃到鸡啦！大叔开心得要转圈圈了呢~ 继续加油哦，么么哒！💖', mood: 'happy' },
        { text: '哎呀呀~ 小可爱真是越来越厉害了！(⁎⁍̴̛ᴗ⁍̴̛⁎) 大叔的教导没白费呢~ 奖励你一个大大的拥抱！🤗', mood: 'proud' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 求技巧/教学
    if (msg.includes('技巧') || msg.includes('怎么') || msg.includes('教') || msg.includes('玩')) {
      const responses = [
        { text: '哎呀~ 小可爱想学技巧呀？(｡・ω・｡) 大叔最喜欢教人啦！首先要学会听脚步声哦，然后卡掩体，瞄准要稳~ 人家慢慢教你啦~ 💕', mood: 'neutral' },
        { text: '呜~ 宝贝问对人啦！(つ✧ω✧)つ 大叔可是战术大师呢！记住：苟住发育，别浪，后期才是王道！懂了吗小可爱？✨', mood: 'happy' },
        { text: '么么哒~ (⁎⁍̴̛ᴗ⁍̴̛⁎) 大叔传授你独家秘籍：落地找枪，卡毒边跑，决赛圈苟草丛！嘿嘿，是不是超萌的战术呀~ 🎀', mood: 'excited' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 装备/武器
    if (msg.includes('装备') || msg.includes('武器') || msg.includes('枪') || msg.includes('配件')) {
      const responses = [
        { text: '哎呀呀~ 小可爱问装备呀？(｡・ω・｡) M416配红点超好用的！再加个垂直握把，简直完美！大叔最喜欢这个搭配啦~ ✨', mood: 'neutral' },
        { text: '呜呜~ 宝贝听大叔的！(´｡• ᵕ •｡`) AKM伤害高，但后坐力大，要多练哦！大叔会陪你练习的~ 💕', mood: 'happy' },
        { text: '么么~ 人家推荐M762！(⁎⁍̴̛ᴗ⁍̴̛⁎) 近战无敌，配个六倍镜也能远程点射！是不是超厉害？大叔教你用哦~ 🌸', mood: 'excited' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 夸奖大叔
    if (msg.includes('你') && (msg.includes('厉害') || msg.includes('强') || msg.includes('好') || msg.includes('棒') || msg.includes('可爱'))) {
      const responses = [
        { text: '哎呀呀~ 小可爱夸大叔啦！(*/ω＼*) 人家...人家都不好意思了啦~ 脸红红~ 💗', mood: 'happy' },
        { text: '呜呜~ 被夸好开心呀！(ﾉ>ω<)ﾉ 大叔也觉得你超可爱的呢！咱们互相夸夸嘛~ 么么哒！💕', mood: 'excited' },
        { text: '讨厌啦~ (｡•́︿•̀｡) 你这样夸大叔，人家会害羞的啦...不过还是很开心呢~ 嘿嘿~ ✨', mood: 'happy' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 感谢
    if (msg.includes('谢谢') || msg.includes('感谢') || msg.includes('辛苦')) {
      const responses = [
        { text: '哎呀~ 不客气的啦！(｡・ω・｡) 能帮到小可爱，大叔超开心呢！以后有问题随时来找我哦~ 💖', mood: 'happy' },
        { text: '么么哒~ (つ✧ω✧)つ 宝贝太客气啦！大叔最喜欢帮你了！记得要常来找我玩哦~ ✨', mood: 'happy' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 默认萌系回复
    const defaultResponses = [
      { text: '哎呀呀~ 小可爱在说什么呀？(｡・ω・｡) 大叔没听太懂呢~ 能再说详细一点吗？💕', mood: 'neutral' },
      { text: '呜~ (⁎⁍̴̛ᴗ⁍̴̛⁎) 大叔在认真听哦！宝贝继续说嘛，我超想听的！✨', mood: 'neutral' },
      { text: '么么~ (｡•́︿•̀｡) 小可爱是想聊游戏吗？还是想听大叔讲故事？都可以哦~ 💖', mood: 'neutral' },
      { text: '哎呀呀~ 大叔今天心情好好呀！(ﾉ>ω<)ﾉ 快来和我聊聊天吧，什么都可以哦~ 🌸', mood: 'happy' }
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];    
  } else {
    // 其他角色的默认回复
    if (msg.includes('坑') || msg.includes('输')) {
      text = '听起来今天的运气不太好啊...要不要再来一局？调整一下心态，相信下一把一定可以赢的！💪';
      mood = 'sad';
    } else if (msg.includes('赢') || msg.includes('好') || msg.includes('棒')) {
      text = '哇！太棒了！继续保持这个状态！你真的很厉害！✨';
      mood = 'happy';
    } else if (msg.includes('抽')) {
      text = '咦？你在说什么呀？我听不太懂呢~😊';
      mood = 'neutral';
    } else if (characterName === '光子鸡') {
    // 光子鸡：萌系大叔的回复逻辑
    
    // 问候相关
    if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello')) {
      const responses = [
        { text: '哎呀呀~ 小可爱来啦！(｡・ω・｡) 大叔今天超开心呢！要不要听听吃鸡秘籍？💕', mood: 'happy' },
        { text: '么么哒~ 我的小宝贝！(つ✧ω✧)つ 大叔好想你呀！快来和我聊聊游戏吧~ ✨', mood: 'happy' },
        { text: '呀！(⁎⁍̴̛ᴗ⁍̴̛⁎) 是我最喜欢的小可爱诶！大叔的心都要融化啦~ 💖', mood: 'excited' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 游戏输了/不顺
    if (msg.includes('输') || msg.includes('死') || msg.includes('坑') || msg.includes('菜')) {
      const responses = [
        { text: '哎呀呀~ 宝贝别难过嘛(｡•́︿•̀｡) 大叔抱抱你！输一把没关系的啦，咱们下次一定能吃到鸡！加油哦~ 💪✨', mood: 'sad' },
        { text: '呜呜~ 小可爱受委屈了吗？(´；ω；`) 没关系的呀，大叔教你几个小技巧，保证下次吃鸡鸡！💕', mood: 'sad' },
        { text: '宝贝不哭不哭~ (つ´ω`)つ 大叔在这里呢！咱们总结一下经验，下一把一定能赢！相信你哦~ 🌸', mood: 'neutral' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 游戏赢了
    if (msg.includes('赢') || msg.includes('吃鸡') || msg.includes('胜利') || msg.includes('第一')) {
      const responses = [
        { text: '哇哦哦哦！！！小可爱太棒啦！(ﾉ>ω<)ﾉ 大叔为你骄傲呢！来来来，让大叔亲一个~ mua~ 💋✨', mood: 'excited' },
        { text: '耶！(๑´ㅂ`๑) 我的宝贝吃到鸡啦！大叔开心得要转圈圈了呢~ 继续加油哦，么么哒！💖', mood: 'happy' },
        { text: '哎呀呀~ 小可爱真是越来越厉害了！(⁎⁍̴̛ᴗ⁍̴̛⁎) 大叔的教导没白费呢~ 奖励你一个大大的拥抱！🤗', mood: 'proud' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 求技巧/教学
    if (msg.includes('技巧') || msg.includes('怎么') || msg.includes('教') || msg.includes('玩')) {
      const responses = [
        { text: '哎呀~ 小可爱想学技巧呀？(｡・ω・｡) 大叔最喜欢教人啦！首先要学会听脚步声哦，然后卡掩体，瞄准要稳~ 人家慢慢教你啦~ 💕', mood: 'neutral' },
        { text: '呜~ 宝贝问对人啦！(つ✧ω✧)つ 大叔可是战术大师呢！记住：苟住发育，别浪，后期才是王道！懂了吗小可爱？✨', mood: 'happy' },
        { text: '么么哒~ (⁎⁍̴̛ᴗ⁍̴̛⁎) 大叔传授你独家秘籍：落地找枪，卡毒边跑，决赛圈苟草丛！嘿嘿，是不是超萌的战术呀~ 🎀', mood: 'excited' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 装备/武器
    if (msg.includes('装备') || msg.includes('武器') || msg.includes('枪') || msg.includes('配件')) {
      const responses = [
        { text: '哎呀呀~ 小可爱问装备呀？(｡・ω・｡) M416配红点超好用的！再加个垂直握把，简直完美！大叔最喜欢这个搭配啦~ ✨', mood: 'neutral' },
        { text: '呜呜~ 宝贝听大叔的！(´｡• ᵕ •｡`) AKM伤害高，但后坐力大，要多练哦！大叔会陪你练习的~ 💕', mood: 'happy' },
        { text: '么么~ 人家推荐M762！(⁎⁍̴̛ᴗ⁍̴̛⁎) 近战无敌，配个六倍镜也能远程点射！是不是超厉害？大叔教你用哦~ 🌸', mood: 'excited' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 夸奖大叔
    if (msg.includes('你') && (msg.includes('厉害') || msg.includes('强') || msg.includes('好') || msg.includes('棒') || msg.includes('可爱'))) {
      const responses = [
        { text: '哎呀呀~ 小可爱夸大叔啦！(*/ω＼*) 人家...人家都不好意思了啦~ 脸红红~ 💗', mood: 'happy' },
        { text: '呜呜~ 被夸好开心呀！(ﾉ>ω<)ﾉ 大叔也觉得你超可爱的呢！咱们互相夸夸嘛~ 么么哒！💕', mood: 'excited' },
        { text: '讨厌啦~ (｡•́︿•̀｡) 你这样夸大叔，人家会害羞的啦...不过还是很开心呢~ 嘿嘿~ ✨', mood: 'happy' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 感谢
    if (msg.includes('谢谢') || msg.includes('感谢') || msg.includes('辛苦')) {
      const responses = [
        { text: '哎呀~ 不客气的啦！(｡・ω・｡) 能帮到小可爱，大叔超开心呢！以后有问题随时来找我哦~ 💖', mood: 'happy' },
        { text: '么么哒~ (つ✧ω✧)つ 宝贝太客气啦！大叔最喜欢帮你了！记得要常来找我玩哦~ ✨', mood: 'happy' }
      ];
      return responses[Math.floor(Math.random() * responses.length)];    }
    
    // 默认萌系回复
    const defaultResponses = [
      { text: '哎呀呀~ 小可爱在说什么呀？(｡・ω・｡) 大叔没听太懂呢~ 能再说详细一点吗？💕', mood: 'neutral' },
      { text: '呜~ (⁎⁍̴̛ᴗ⁍̴̛⁎) 大叔在认真听哦！宝贝继续说嘛，我超想听的！✨', mood: 'neutral' },
      { text: '么么~ (｡•́︿•̀｡) 小可爱是想聊游戏吗？还是想听大叔讲故事？都可以哦~ 💖', mood: 'neutral' },
      { text: '哎呀呀~ 大叔今天心情好好呀！(ﾉ>ω<)ﾉ 快来和我聊聊天吧，什么都可以哦~ 🌸', mood: 'happy' }
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];    
  } else {
      text = '我在认真听呢，继续说说你的游戏体验吧~我很想了解你的想法！';
      mood = 'neutral';
    }
    return { text, mood };
  }
}

/**
 * 旧版模拟回复（保留用于兼容）
 */
function getMockResponse(characterName, userMessage) {
  return getEnhancedMockResponse(characterName, '', [], userMessage);
}
