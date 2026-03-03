/**
 * 广场页面组件 - 展示公开的对话
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, Eye, Heart, Calendar, Loader, TrendingUp, Clock, ThumbsUp, MessageSquare, Play, X, Send } from 'lucide-react';
import { getPublicConversations, toggleLike, getConversation } from '../services/conversationService';

export default function PlazaView({ onBack, onSelectConversation, onRemix }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent | popular | likes
  const [likedConversations, setLikedConversations] = useState(new Set());
  const [selectedConv, setSelectedConv] = useState(null); // 当前查看的对话
  const [comments, setComments] = useState([]); // 评论列表
  const [newComment, setNewComment] = useState(''); // 新评论输入
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [sortBy]);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicConversations(50, 0, sortBy);
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('加载广场失败:', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e, conversationId) => {
    e.stopPropagation(); // 阻止点击事件冒泡
    
    try {
      const result = await toggleLike(conversationId);
      
      // 更新本地状态
      setLikedConversations(prev => {
        const newSet = new Set(prev);
        if (result.liked) {
          newSet.add(conversationId);
        } else {
          newSet.delete(conversationId);
        }
        return newSet;
      });

      // 更新列表中的点赞数
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, likes: result.likes }
            : conv
        )
      );
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 查看对话详情
  const handleViewConversation = async (conv) => {
    setSelectedConv(conv);
    
    // 加载完整对话内容和评论
    try {
      const fullConv = await getConversation(conv.id);
      setSelectedConv(fullConv);
      
      // 加载评论
      loadComments(conv.id);
    } catch (err) {
      console.error('加载对话详情失败:', err);
    }
  };

  // 加载评论
  const loadComments = async (conversationId) => {
    try {
      const response = await fetch(`/api/get-comments?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('加载评论失败:', err);
      setComments([]);
    }
  };

  // 提交评论
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedConv) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/add-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          content: newComment,
          userId: localStorage.getItem('userId') || 'anonymous'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      console.error('提交评论失败:', err);
      alert('评论失败，请稍后重试');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Remix对话
  const handleRemix = () => {
    if (!selectedConv) return;
    
    // 调用父组件的Remix回调，传递对话数据
    if (onRemix) {
      onRemix({
        gameName: selectedConv.gameName,
        characterName: selectedConv.characterName,
        chatHistory: selectedConv.chatHistory || []
      });
    }
    setSelectedConv(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-[calc(100vh-64px)] bg-slate-900"
    >
      {/* 对话详情弹窗 */}
      <AnimatePresence>
        {selectedConv && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedConv(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700"
            >
              {/* 头部 */}
              <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h3 className="font-bold text-lg">{selectedConv.title}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedConv.gameName} · {selectedConv.characterName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedConv(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 对话内容 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/30">
                {selectedConv.chatHistory?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-xl text-sm ${
                        msg.sender === 'user'
                          ? 'bg-pink-600 text-white rounded-tr-sm'
                          : 'bg-slate-700 text-slate-200 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Remix按钮 */}
              <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                <button
                  onClick={handleRemix}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                >
                  <Play size={18} />
                  Remix - 基于此对话继续聊天
                </button>
              </div>

              {/* 评论区 */}
              <div className="border-t border-slate-700 bg-slate-900/50">
                <div className="p-4">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    评论 ({comments.length})
                  </h4>

                  {/* 评论输入 */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                      placeholder="写下你的评论..."
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                      disabled={isSubmittingComment}
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Send size={16} />
                    </button>
                  </div>

                  {/* 评论列表 */}
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-4">暂无评论</p>
                    ) : (
                      comments.map((comment, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {comment.userId?.charAt(0) || 'U'}
                            </div>
                            <span className="text-xs text-slate-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 原有的头部和列表 */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold">对话广场</h2>
            <p className="text-xs text-slate-400">发现其他玩家的精彩对话</p>
          </div>
        </div>

        {/* 排序选项 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              sortBy === 'recent'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Clock size={14} />
            最新
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              sortBy === 'popular'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <TrendingUp size={14} />
            热门
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              sortBy === 'likes'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <ThumbsUp size={14} />
            点赞
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Loader className="animate-spin mb-4" size={32} />
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <p>{error}</p>
            <button
              onClick={loadConversations}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              重试
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageCircle size={48} className="mb-4 opacity-30" />
            <p>暂无公开对话</p>
            <p className="text-sm mt-2">成为第一个分享对话的人吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => {
              const isLiked = likedConversations.has(conv.id);
              
              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-pink-600/50 transition-all cursor-pointer"
                  onClick={() => handleViewConversation(conv)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{conv.title}</h3>
                      <p className="text-xs text-slate-400 mb-2">
                        {conv.gameName} · {conv.characterName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MessageCircle size={12} />
                          {conv.messageCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {conv.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(conv.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* 点赞按钮 */}
                    <button
                      onClick={(e) => handleLike(e, conv.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                        isLiked
                          ? 'bg-pink-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      <Heart
                        size={14}
                        className={isLiked ? 'fill-current' : ''}
                      />
                      <span className="text-xs font-medium">{conv.likes || 0}</span>
                    </button>
                  </div>
                  
                  {conv.lastMessagePreview && (
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {conv.lastMessagePreview}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
