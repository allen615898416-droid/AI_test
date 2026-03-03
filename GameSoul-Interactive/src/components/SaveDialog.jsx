/**
 * 保存对话弹窗组件
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader, Check } from 'lucide-react';

export default function SaveDialog({ isOpen, onClose, onSave, isSaving }) {
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = () => {
    onSave(isPublic);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
          >
            <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Save className="text-cyan-400" size={24} />
                  保存对话
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 内容 */}
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  保存这段对话，随时回顾你与AI角色的精彩互动！
                </p>

                {/* 公开选项 */}
                <div className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-500 text-pink-600 focus:ring-pink-500 focus:ring-offset-slate-800"
                  />
                  <label htmlFor="isPublic" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">分享到广场</div>
                    <div className="text-xs text-slate-400">让其他玩家也能看到这段对话</div>
                  </label>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      确认保存
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
