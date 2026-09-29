import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Link2,
  Smartphone,
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
  CheckCircle2,
  Lock,
  Key,
  ShieldAlert,
  Server,
  Cloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const SubscriptionGuideTab: React.FC = () => {
  const [activeSub, setActiveSub] = useState<'hy2' | 'hy1' | 'clash_meta'>('hy2');
  const [repoType, setRepoType] = useState<'public' | 'private'>('public');
  const [username, setUsername] = useState('zxv9526');
  const [repoName, setRepoName] = useState('clash');
  const [branch, setBranch] = useState('main');
  const [githubToken, setGithubToken] = useState('');
  const [showWorkerCode, setShowWorkerCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const cleanUser = username.trim() || 'zxv9526';
  const cleanRepo = repoName.trim() || 'clash';
  const cleanBranch = branch.trim() || 'main';
  const cleanToken = githubToken.trim();

  // Target filename based on selected subscription
  const targetFile =
    activeSub === 'hy2'
      ? 'hy2_config.yaml'
      : activeSub === 'hy1'
      ? 'hy1_config.yaml'
      : 'config.yaml';

  // Public Subscription URL formats
  const rawUrl = `https://raw.githubusercontent.com/${cleanUser}/${cleanRepo}/${cleanBranch}/${targetFile}`;
  const ghFastUrl = `https://ghfast.top/${rawUrl}`;
  const gitMirrorUrl = `https://raw.gitmirror.com/${cleanUser}/${cleanRepo}/${cleanBranch}/${targetFile}`;
  const jsDelivrUrl = `https://cdn.jsdelivr.net/gh/${cleanUser}/${cleanRepo}@${cleanBranch}/${targetFile}`;

  // Alternate master branch URL
  const altBranch = cleanBranch === 'main' ? 'master' : 'main';
  const altGhFastUrl = `https://ghfast.top/https://raw.githubusercontent.com/${cleanUser}/${cleanRepo}/${altBranch}/${targetFile}`;

  // Private Subscription URL formats
  const privateTokenUrl = cleanToken
    ? `https://raw.githubusercontent.com/${cleanUser}/${cleanRepo}/${cleanBranch}/${targetFile}?token=${cleanToken}`
    : `https://raw.githubusercontent.com/${cleanUser}/${cleanRepo}/${cleanBranch}/${targetFile}?token=YOUR_GITHUB_TOKEN`;

  const privateGhFastUrl = cleanToken
    ? `https://ghfast.top/${privateTokenUrl}`
    : `https://ghfast.top/https://raw.githubusercontent.com/${cleanUser}/${cleanRepo}/${cleanBranch}/${targetFile}?token=YOUR_GITHUB_TOKEN`;

  const workerScriptCode = `// Cloudflare Worker: 保护私有仓库并免翻墙高速订阅
const GITHUB_USER = "${cleanUser}";
const GITHUB_REPO = "${cleanRepo}";
const GITHUB_BRANCH = "${cleanBranch}";
const GITHUB_TOKEN = "${cleanToken || 'ghp_你的GitHub_Token'}";
const AUTH_KEY = "mysecret";

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== AUTH_KEY) {
    return new Response("Unauthorized: Invalid Key", { status: 403 });
  }

  const rawUrl = \`https://raw.githubusercontent.com/\${GITHUB_USER}/\${GITHUB_REPO}/\${GITHUB_BRANCH}/config.yaml\`;
  const response = await fetch(rawUrl, {
    headers: {
      "Authorization": \`token \${GITHUB_TOKEN}\`,
      "User-Agent": "Clash-Private-Proxy"
    }
  });

  if (!response.ok) {
    return new Response(\`GitHub Raw Error: \${response.statusText}\`, { status: response.status });
  }

  const body = await response.text();
  return new Response(body, {
    headers: {
      "content-type": "text/yaml; charset=utf-8",
      "cache-control": "no-cache"
    }
  });
};`;

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Subscription Selection Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white">选择要导出的订阅工作流通道</h3>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            两个工作流相互独立 · 互不影响
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Sub 1: HY2 */}
          <button
            onClick={() => setActiveSub('hy2')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              activeSub === 'hy2'
                ? 'bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-indigo-500/80 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>Hysteria 2 (HY2) 独立订阅</span>
              </span>
              <code className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                hy2_config.yaml
              </code>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              从 12 个 Hysteria 2 JSON 配置源独立抓取并解析，原生 HY2 专用通道。
            </p>
          </button>

          {/* Sub 2: HY1 */}
          <button
            onClick={() => setActiveSub('hy1')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              activeSub === 'hy1'
                ? 'bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-indigo-500/80 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Hysteria 1 (HY1) 独立订阅</span>
              </span>
              <code className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                hy1_config.yaml
              </code>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              从 12 个 Hysteria 1 JSON 配置源独立抓取并解析，HY1 专用订阅通道。
            </p>
          </button>

          {/* Sub 3: Clash Meta */}
          <button
            onClick={() => setActiveSub('clash_meta')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              activeSub === 'clash_meta'
                ? 'bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-indigo-500/80 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Clash Meta (主节点混合订阅)</span>
              </span>
              <code className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                config.yaml
              </code>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              原始 Clash.meta2 订阅（含多协议混合节点），保持初始配置稳定运行。
            </p>
          </button>
        </div>
      </div>

      {/* Top Banner & Repo Mode Toggle */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {activeSub === 'hy2'
                  ? '⚡ Hysteria 2 (HY2) 专用订阅直链 (含 Karing / Clash Meta / Base64)'
                  : activeSub === 'hy1'
                  ? '⚡ Hysteria 1 (HY1) 专用订阅直链'
                  : '⚡ Clash Meta 主订阅直链'}
              </h2>
              <p className="text-xs text-slate-400">
                当前正在生成 <strong className="text-indigo-300">{targetFile}</strong> 的客户端直连订阅（支持 Karing / Clash Verge / v2rayNG / Shadowrocket）。
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setRepoType('private')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                repoType === 'private'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>🔒 私有仓库 (推荐·防泄密)</span>
            </button>
            <button
              onClick={() => setRepoType('public')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                repoType === 'public'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 公开仓库 (免认证)</span>
            </button>
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
            <label className="text-xs font-semibold text-slate-300">仓库名称</label>
            <input
              type="text"
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              placeholder="例如: clash"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">分支 (Branch)</label>
            <input
              type="text"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              placeholder="例如: main 或 master"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* If Private Mode: Token Input */}
        {repoType === 'private' && (
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>GitHub Personal Access Token (PAT)</span>
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=Clash-Subscription"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
              >
                <span>点击去 GitHub 申请 Token (只需勾选 repo 读权限)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              placeholder="粘贴你的 GitHub Token (以 ghp_ 开头)"
              className="w-full bg-slate-950 border border-emerald-900/60 rounded-lg px-3 py-2 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              💡 填入 Token 后，下方将自动生成带有安全鉴权的私有直链。仓库保持私有（Private），任何外人都无法查看你的节点！
            </p>
          </div>
        )}
      </div>

      {/* PRIVATE REPO SOLUTIONS */}
      {repoType === 'private' ? (
        <div className="space-y-4">
          {/* Solution 1: Private Token Raw Link */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-3 py-0.5 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[10px] font-bold rounded-bl-lg">
              方案 1: 客户端直填 Token 专属链接
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">私有仓库加速订阅链接 (含 Token 授权)</h3>
            </div>
            <p className="text-xs text-slate-400">
              已将 Token 附带在 URL 参数中，Android / Clash 客户端可直接读取私有仓库，解决 404 错误。
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
              <input
                type="text"
                readOnly
                value={privateGhFastUrl}
                className="w-full bg-transparent text-xs font-mono text-emerald-300 focus:outline-none truncate"
              />
              <button
                onClick={() => handleCopy('private-ghfast', privateGhFastUrl)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-md font-medium shrink-0 flex items-center gap-1 transition-all"
              >
                {copiedLink === 'private-ghfast' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'private-ghfast' ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>

          {/* Solution 2: Cloudflare Workers 0 Cost Proxy */}
          <div className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">方案 2: Cloudflare Workers 终极私密中转 (最推荐 ⭐)</h3>
              </div>
              <button
                onClick={() => setShowWorkerCode(!showWorkerCode)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>{showWorkerCode ? '收起部署代码' : '查看 10秒部署代码'}</span>
                {showWorkerCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              利用 Cloudflare 免费 Worker 作为安全网关：在 Worker 内部保存 GitHub Token，对外只暴露自定义密匙链接，既保持仓库 100% 私有，又能国内秒级高速更新订阅！
            </p>

            {showWorkerCode && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">复制下方代码到 Cloudflare Worker 中保存即可：</span>
                  <button
                    onClick={() => handleCopy('worker-code', workerScriptCode)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded flex items-center gap-1"
                  >
                    {copiedLink === 'worker-code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink === 'worker-code' ? '已复制代码' : '复制代码'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-indigo-300 overflow-x-auto border border-slate-800/80 max-h-52">
                  {workerScriptCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PUBLIC REPO SOLUTIONS */
        <div className="grid grid-cols-1 gap-3.5">
          {/* Recommended: Ghfast proxy main branch */}
          <div className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-4 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-3 py-0.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white text-[10px] font-bold rounded-bl-lg">
              ⭐ 手机客户端最推荐（国内免翻墙高速直连）
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">国内高速加速订阅链接 (ghfast.top - main 分支)</h3>
            </div>
            <p className="text-xs text-slate-400">
              即使手机未开启代理，国内移动/联通/电信网络也能秒级刷新并下载配置。
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

          {/* Alternate: Ghfast master branch (if repo is master) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">国内高速加速备用链接 (ghfast.top - master 分支)</h3>
            </div>
            <p className="text-xs text-slate-400">
              如果你的 GitHub 仓库默认主分支是 <strong>master</strong> 而不是 main，请使用此链接。
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
              <input
                type="text"
                readOnly
                value={altGhFastUrl}
                className="w-full bg-transparent text-xs font-mono text-emerald-300 focus:outline-none truncate"
              />
              <button
                onClick={() => handleCopy('alt-ghfast', altGhFastUrl)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md font-medium shrink-0 flex items-center gap-1 transition-all"
              >
                {copiedLink === 'alt-ghfast' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'alt-ghfast' ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>

          {/* GitMirror proxy */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">国内 GitMirror 备用加速镜像</h3>
            </div>
            <p className="text-xs text-slate-400">
              双保险镜像源，当其他 CDN 节点波动时可随时无缝替代。
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
              <input
                type="text"
                readOnly
                value={gitMirrorUrl}
                className="w-full bg-transparent text-xs font-mono text-purple-300 focus:outline-none truncate"
              />
              <button
                onClick={() => handleCopy('gitmirror', gitMirrorUrl)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md font-medium shrink-0 flex items-center gap-1 transition-all"
              >
                {copiedLink === 'gitmirror' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'gitmirror' ? '已复制' : '复制'}</span>
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
        </div>
      )}

      {/* Client Setup Walkthrough */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span>Android / Windows / iOS 客户端设置建议</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">1. 排查分支名称</h4>
            <p className="text-slate-400 leading-relaxed">
              打开你的 GitHub 仓库，确认默认分支是 <strong>main</strong> 还是 <strong>master</strong>。若链接中分支不一致会导致 404。
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">2. 私有仓库必须带 Token</h4>
            <p className="text-slate-400 leading-relaxed">
              私有仓库无法被公开匿名访问，请使用带 <strong>?token=...</strong> 的链接或使用 Cloudflare Worker 反代。
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">3. 手机客户端更新周期</h4>
            <p className="text-slate-400 leading-relaxed">
              在客户端订阅设置中将「自动更新」设为 <strong>1440 分钟 (24小时)</strong>，即可与 GitHub 每天一次更新保持同步。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

