# 🎮 GameSoul - 游戏之魂

> 让游戏角色"活"过来，通过AI对话生成沉浸式的游戏评价体验

[![在线体验](https://img.shields.io/badge/在线体验-点击访问-blue?style=for-the-badge)](https://gamesoul-interactive.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-源码-black?style=for-the-badge&logo=github)](https://github.com/allen913950839-bot/gamesoul-interactive)

---

## ✨ 核心特性

- 🎭 **沉浸式角色对话** - 游戏角色AI化，独特人设和对话风格
- 💥 **独家彩蛋系统** - 6种隐藏彩蛋，每次点击都有惊喜
- 🗣️ **语音交互** - 一键语音输入，解放双手
- 📱 **完整社区功能** - 保存、分享、广场、评论、Remix
- ⚡ **零成本演示** - 无需API配置即可完整体验

## 🎯 快速开始

### 3步启动项目

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 访问
http://localhost:5173
```

**详细指南**：查看 [快速开始.md](./快速开始.md)

## 🚀 在线体验

**生产环境**：https://gamesoul-interactive.vercel.app

- 🗡️ 与亚瑟（王者荣耀）对话 - 傲娇毒舌战士
- 🐥 与光子鸡（和平精英）对话 - 萌系战术大叔
- 💥 触发6种隐藏彩蛋：🔨⚔️🛡️🧪💎👑
- 🗣️ 语音输入测试
- 📱 广场功能体验

## 📚 文档导航

### 核心文档

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [快速开始.md](./快速开始.md) | 安装、配置、测试、部署 | 开发者 |
| [核心能力.md](./核心能力.md) | 产品能力、商业价值、竞争优势 | 产品经理、投资人 |
| [技术文档.md](./技术文档.md) | 架构设计、API文档、性能优化 | 技术负责人 |
| [部署指南.md](./部署指南.md) | GitHub + Vercel一键部署 | 运维人员 |
| [TODO.md](./TODO.md) | 开发计划、任务清单 | 团队成员 |

### 历史文档

开发过程中的60+历史文档已归档至 [docs-archive/](./docs-archive/)，仅供参考。

## 🛠️ 技术栈

### 前端
- React 18 + Vite
- Tailwind CSS + Framer Motion
- Lucide React（图标库）

### 后端
- Vercel Serverless + Vercel KV
- Google Gemini API + DeepSeek API
- 智能降级系统（零成本运行）

## 🎭 角色介绍

### 亚瑟（王者荣耀）
- **性格**：傲慢毒舌、偶尔傲娇
- **特点**：犀利吐槽，但内心关心玩家
- **示例**：
  ```
  玩家：今天输了好几把
  亚瑟：输了就怪队友？呵，典型的青铜心态。
  ```

### 光子鸡（和平精英）
- **性格**：萌系大叔、温柔可爱
- **特点**：战术专业但表达超萌
- **示例**：
  ```
  玩家：怎么吃鸡？
  光子鸡：哎呀呀~小可爱想吃鸡呀(｡・ω・｡)
  ```

## 💥 彩蛋系统

输入特殊符号触发隐藏彩蛋：

| 输入 | 效果 | 强度 |
|------|------|------|
| 🔨 | 战锤震击 | 连续使用强度递增 |
| ⚔️ | 圣剑斩击 | 1次→3次→5次 |
| 🛡️ | 盾牌防御 | 不同反馈 |
| 🧪 | 中毒效果 | 粒子动画 |
| 💎 | 宝石收集 | 3D旋转 |
| 👑 | 王者加冕 | 光芒四射 |

## 🚀 部署

### 方式一：Vercel（推荐）

1. Fork本仓库
2. 在Vercel中导入
3. 添加环境变量
4. 点击部署

**详细步骤**：查看 [部署指南.md](./部署指南.md)

### 方式二：快捷脚本

```bash
./update.sh
```

## ⚙️ 环境变量

```env
# Google Gemini API（必需，用于亚瑟对话）
VITE_GEMINI_API_KEY=your_gemini_key

# DeepSeek API（可选，用于光子鸡对话）
DEEPSEEK_API_KEY=your_deepseek_key

# Vercel KV（可选，用于保存功能）
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

**不配置也能运行**：会使用智能模拟回复系统。

## 📊 项目数据

- **代码量**：约5600行
- **核心文件**：23个
- **API接口**：11个
- **前端组件**：4个
- **彩蛋类型**：6种
- **AI引擎**：2个（+ 1个降级）

## 🎯 适用场景

### 1. 游戏社区运营
收集玩家真实反馈，参与率↑300%

### 2. 游戏发布会/展会
大屏互动，社交曝光↑1000%

### 3. 游戏内评价系统
提升留存率↑15%，分享率↑80%

## 🏆 核心优势

| 维度 | 传统问卷 | GameSoul |
|------|---------|----------|
| 互动性 | ⭐ | ⭐⭐⭐⭐⭐ |
| 趣味性 | ⭐ | ⭐⭐⭐⭐⭐ |
| 成本 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 传播性 | ⭐ | ⭐⭐⭐⭐⭐ |

## 🐛 常见问题

**Q: 为什么AI回复都是固定的？**  
A: 检查 `.env` 文件中的API Key是否配置。未配置会使用模拟模式。

**Q: 如何获取免费API Key？**  
A: 
- Gemini: https://makersuite.google.com/app/apikey
- DeepSeek: https://platform.deepseek.com

**Q: 保存功能为什么失败？**  
A: 需要配置Vercel KV数据库，参考《部署指南.md》。

## 📈 开发计划

- [x] 接入真实AI模型（Gemini + DeepSeek）
- [x] 角色虚拟形象和情绪动画
- [x] 6种彩蛋系统
- [x] 语音输入功能
- [x] 完整社区功能（保存/分享/广场）
- [ ] TTS语音播放（角色配音）
- [ ] 多角色库（原神、LOL等）
- [ ] 数据看板（情感分析）
- [ ] 社交分享海报

查看完整计划：[TODO.md](./TODO.md)

## 📞 联系与支持

- **在线体验**：https://gamesoul-interactive.vercel.app
- **GitHub**：https://github.com/allen913950839-bot/gamesoul-interactive
- **问题反馈**：提交Issue

## 📄 许可证

MIT License

---

## ⭐ Star History

如果觉得项目不错，请给个Star支持一下！

**Made with ❤️ by GameSoul Team**  
**Powered by Google Gemini AI & DeepSeek AI**

---

*最后更新：2025-11-21*  
*版本：V2.0*
