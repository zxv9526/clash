import React, { useState } from 'react';
import { BookOpen, Copy, Check, ExternalLink, Link2, Smartphone, ShieldCheck, Zap, Globe, Sparkles, CheckCircle2 } from 'lucide-react';

export const SubscriptionGuideTab: React.FC = () => {
  const [username, setUsername] = useState('your-username');
  const [repoName, setRepoName] = useState('clash-12node-workflow');
  const [branch, setBranch] = useState('main');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const cleanUser = username.trim() || 'your-username';
  const cleanRepo = repoName.trim() || 'clash-12node-workflow';
  const cleanBranch = branch.trim() || 'main';

  // Subscription URL formats
  const rawUrl = `https://raw.githubusercontent.com/${cleanUser}/${cleanRepo}/${cleanBranch}/config.yaml`;
  const ghFastUrl = `https://ghfast.top/${rawUrl}`;
  const ghProxyUrl = `https://mirror.ghproxy.com/${rawUrl}`;
  const jsDelivrUrl = `https://cdn.jsdelivr.net/gh/${cleanUser}/${cleanRepo}@${cleanBranch}/config.yaml`;
  const pagesUrl = `https://${cleanUser}.github.io/${cleanRepo}/config.yaml`;

  const clashDeepLink = `clash://install-config?url=${encodeURIComponent(ghFastUrl)}&name=${encodeURIComponent('12Node-Clash-Meta')}`;

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Link2 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Clash / Mihomo 客户端订阅直链生成器
            </h2>
            <p className="text-xs text-slate-400">
              输入你的 GitHub 用户名与仓库名称，实时生成各客户端可直接导入的订阅链接（含国内免代理加速通道）。
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">GitHub 用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="例如: zxv9526"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">仓库名称 (Repo Name)</label>
            <input
              type="text"
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              placeholder="例如: clash-sub"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">分支 (Branch)</label>
            <input
              type="text"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              placeholder="默认: main"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Generated Links Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {/* Recommended: Ghfast proxy */}
        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-4 space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 px-3 py-0.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white text-[10px] font-bold rounded-bl-lg">
            ⭐ 强烈推荐（国内免翻墙高速直连）
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">国内加速代理订阅链接 (ghfast.top)</h3>
          </div>
          <p className="text-xs text-slate-400">
            国内宽带和手机网络可直接更新订阅，无需先开启代理，节点更新更稳妥。
          </p>
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <input
              type="text"
              readOnly
              value={ghFastUrl}
              className="w-full bg-transparent text-xs font-mono text-indigo-300 focus:outline-none truncate"
            />
            <button
              onClick={() => handleCopy('ghfast', ghFastUrl)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md font-medium shrink-0 flex items-center gap-1 transition-all"
            >
              {copiedLink === 'ghfast' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink === 'ghfast' ? '已复制' : '复制'}</span>
            </button>
          </div>
        </div>

        {/* GitHub Raw Standard */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">GitHub 官方 Raw 原生直链</h3>
          </div>
          <p className="text-xs text-slate-400">
            适合在已有代理环境下使用，始终获取 GitHub 仓库最新提交的数据。
          </p>
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <input
              type="text"
              readOnly
              value={rawUrl}
              className="w-full bg-transparent text-xs font-mono text-slate-300 focus:outline-none truncate"
            />
            <button
              onClick={() => handleCopy('raw', rawUrl)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md font-medium shrink-0 flex items-center gap-1 transition-all"
            >
              {copiedLink === 'raw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink === 'raw' ? '已复制' : '复制'}</span>
            </button>
          </div>
        </div>

        {/* jsDelivr CDN */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">jsDelivr 全球 CDN 直链</h3>
          </div>
          <p className="text-xs text-slate-400">
            全球分布式 CDN 加速分发，延迟极低（更新可能有少量缓存延迟）。
          </p>
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <input
              type="text"
              readOnly
              value={jsDelivrUrl}
              className="w-full bg-transparent text-xs font-mono text-slate-300 focus:outline-none truncate"
            />
            <button
              onClick={() => handleCopy('jsdelivr', jsDelivrUrl)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md font-medium shrink-0 flex items-center gap-1 transition-all"
            >
              {copiedLink === 'jsdelivr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink === 'jsdelivr' ? '已复制' : '复制'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Client Setup Walkthrough */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span>支持的客户端导入方法</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">Clash Verge Rev / Mihomo Party</h4>
            <p className="text-slate-400 leading-relaxed">
              打开客户端 &gt; 订阅管理 / 配置 &gt; 粘贴上方订阅链接 &gt; 保存并更新。建议开启「自动更新」(例如设置为 360 分钟)。
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">Shadowrocket (小火箭) / Stash</h4>
            <p className="text-slate-400 leading-relaxed">
              点击右上角 <strong>+</strong> &gt; 类型选择 <strong>Subscribe</strong> 或 <strong>Clash</strong> &gt; 粘贴订阅链接并保存更新即可。
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">Clash Meta for Android / Flclash</h4>
            <p className="text-slate-400 leading-relaxed">
              点击配置 &gt; 新建配置 &gt; 从 URL 导入 &gt; 填入订阅链接 &gt; 设置自动更新间隔为 6 小时。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
