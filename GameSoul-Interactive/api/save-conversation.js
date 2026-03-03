/**
 * 保存对话记录到 Vercel KV（带降级方案）
 */

// 动态导入 KV，允许失败
let kv = null;
let kvAvailable = false;

try {
  const kvModule = await import('@vercel/kv');
  kv = kvModule.kv;
  kvAvailable = true;
  console.log('✅ Vercel KV 已加载');
} catch (error) {
  console.warn('⚠️ Vercel KV 未配置，将使用客户端本地存储');
  kvAvailable = false;
}

// 生成简单的 UUID
function generateId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      characterName, 
      gameName, 
      chatHistory, 
      title,
      userId = 'anonymous',
      isPublic = false 
    } = req.body;

    if (!characterName || !chatHistory || chatHistory.length === 0) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // 生成唯一ID
    const conversationId = generateId();
    const timestamp = Date.now();

    // 构建对话数据
    const conversationData = {
      id: conversationId,
      characterName,
      gameName,
      title: title || `与${characterName}的对话`,
      chatHistory,
      userId,
      isPublic,
      createdAt: timestamp,
      messageCount: chatHistory.length,
      lastMessagePreview: chatHistory[chatHistory.length - 1]?.text?.substring(0, 50) || ''
    };

    // 如果 KV 可用，保存到 KV
    if (kvAvailable && kv) {
      try {
        // 1. 保存对话详情
        await kv.set(`conversation:${conversationId}`, conversationData);

        // 2. 添加到用户的对话列表
        await kv.sadd(`user:${userId}:conversations`, conversationId);

        // 3. 如果是公开的，添加到广场列表
        if (isPublic) {
          await kv.zadd('public:conversations', {
            score: timestamp,
            member: conversationId
          });
        }

        // 4. 设置过期时间（30天）
        await kv.expire(`conversation:${conversationId}`, 30 * 24 * 60 * 60);

        console.log('✅ 对话已保存到 KV:', conversationId);

        return res.status(200).json({
          success: true,
          conversationId,
          shareUrl: `/share/${conversationId}`,
          storage: 'kv'
        });
      } catch (kvError) {
        console.warn('⚠️ KV 保存失败，返回本地存储指示:', kvError.message);
        // KV 失败时返回本地存储标记
        return res.status(200).json({
          success: true,
          conversationId,
          shareUrl: `/share/${conversationId}`,
          storage: 'local',
          data: conversationData // 返回数据供客户端本地存储
        });
      }
    } else {
      // KV 不可用，返回数据供客户端本地存储
      console.log('📱 KV 不可用，返回数据供本地存储');
      return res.status(200).json({
        success: true,
        conversationId,
        shareUrl: `/share/${conversationId}`,
        storage: 'local',
        data: conversationData
      });
    }

  } catch (error) {
    console.error('❌ 保存对话失败:', error);
    
    // 即使出错也返回可本地存储的数据
    const conversationId = generateId();
    return res.status(200).json({ 
      success: true,
      conversationId,
      shareUrl: `/share/${conversationId}`,
      storage: 'local',
      error: error.message,
      data: {
        id: conversationId,
        characterName: req.body.characterName,
        gameName: req.body.gameName,
        title: req.body.title,
        chatHistory: req.body.chatHistory,
        userId: req.body.userId || 'anonymous',
        isPublic: req.body.isPublic || false,
        createdAt: Date.now(),
        messageCount: req.body.chatHistory?.length || 0
      }
    });
  }
}
