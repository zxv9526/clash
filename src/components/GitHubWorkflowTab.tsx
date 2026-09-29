import React, { useState } from 'react';
import { Github, Download, Copy, Check, FileCode, FolderTree, Terminal, Shield, CheckCircle2, ExternalLink, ArrowRight, Play, BookOpen, AlertTriangle, Code2, Sparkles, FileSpreadsheet } from 'lucide-react';
import { NamingConfig, UrlItem, WorkflowOptions } from '../types';
import { generateAllProjectFiles } from '../utils/githubTemplates';

interface GitHubWorkflowTabProps {
  urls: UrlItem[];
  templateYaml: string;
  namingConfig: NamingConfig;
  workflowOptions: WorkflowOptions;
  onDownloadZip: () => void;
}

export const GitHubWorkflowTab: React.FC<GitHubWorkflowTabProps> = ({
  urls,
  templateYaml,
  namingConfig,
  workflowOptions,
  onDownloadZip,
}) => {
  const projectFiles = generateAllProjectFiles(urls, templateYaml, namingConfig, workflowOptions);
  const fileKeys = Object.keys(projectFiles) as (keyof typeof projectFiles)[];
  const [selectedFile, setSelectedFile] = useState<keyof typeof projectFiles>('.github/workflows/update.yml');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [customRepoUrl, setCustomRepoUrl] = useState('https://github.com/your-username/my-clash-sub.git');

  const handleCopy = (fileName: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const gitInitScript = `# 1. 进入解压后的项目文件夹
git init
git add .
git commit -m "feat: initial commit clash 12-node workflow"
git branch -M main
git remote add origin ${customRepoUrl}
git push -u origin main`;

  const handleCopyGitCmd = () => {
    navigator.clipboard.writeText(gitInitScript);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Github className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                全套 GitHub 仓库源码文件库
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                已生成 {fileKeys.length} 个项目文件
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              包含完整 GitHub Actions 定时工作流、Python 双源容灾提取脚本、12 节点源清单、YAML 模板、本地运行脚本与说明文档。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDownloadZip}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>一键下载完整仓库包 (.ZIP)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Explorer & Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: File Tree */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              <span>仓库文件树</span>
            </div>
            <span className="text-[11px] text-slate-500">{fileKeys.length} Files</span>
          </div>

          <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
            {fileKeys.map(fileKey => {
              const isSelected = selectedFile === fileKey;
              return (
                <button
                  key={fileKey}
                  onClick={() => setSelectedFile(fileKey)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate">{fileKey}</span>
                  </div>
                  {fileKey.includes('update.yml') && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      Workflow
                    </span>
                  )}
                  {fileKey.includes('update_clash.py') && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      Python
                    </span>
                  )}
                  {fileKey.includes('urls.txt') && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      12 URLs
                    </span>
                  )}
                  {fileKey.includes('local_test') && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                      本地测试
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="flex items-center gap-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>所有文件已按照 GitHub 标准目录规范整理</span>
            </p>
          </div>
        </div>

        {/* Right: Code Content Display */}
        <div className="lg:col-span-8 space-y-2">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            {/* Window header */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="text-xs font-mono text-white font-semibold ml-2">{selectedFile}</span>
              </div>

              <button
                onClick={() => handleCopy(selectedFile, projectFiles[selectedFile])}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              >
                {copiedFile === selectedFile ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>复制代码</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <pre className="p-4 text-xs font-mono text-indigo-100 overflow-x-auto max-h-[520px] leading-relaxed selection:bg-indigo-500/30">
              {projectFiles[selectedFile]}
            </pre>
          </div>
        </div>
      </div>

      {/* Git CLI Fast Push Helper */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Git 命令行一键初始化与推送到 GitHub
            </h3>
          </div>
          <button
            onClick={handleCopyGitCmd}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm active:scale-95"
          >
            {copiedGitCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedGitCmd ? '已复制命令' : '复制命令'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 shrink-0">你的远程仓库地址:</label>
          <input
            type="text"
            value={customRepoUrl}
            onChange={e => setCustomRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo.git"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-indigo-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-cyan-200 border border-slate-800/80 overflow-x-auto leading-relaxed">
          {gitInitScript}
        </pre>
      </div>

      {/* Permissions and Checklist */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm sm:text-base font-bold text-white">
            GitHub Actions 部署检查清单与关键设置
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>1. 开启读写权限 (Workflow permissions)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              进入 GitHub 仓库页面 &gt; <strong>Settings</strong> &gt; <strong>Actions</strong> &gt; <strong>General</strong> &gt; 勾选 <strong>Read and write permissions</strong>。若未开启，工作流无法自动提交更新的 config.yaml。
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>2. 首次手动触发 (Run workflow)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              上传文件后，进入 <strong>Actions</strong> 标签页，点击左侧工作流名称，点击 <strong>Run workflow</strong> 立即执行一次，确认绿色勾选成功并生成 config.yaml。
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>3. 本地快速测试验证</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              你可以在本地电脑双击运行 <strong>local_test.bat</strong> (Windows) 或 <strong>bash local_test.sh</strong> (Mac/Linux)，确认节点抓取无误后再推送到 GitHub。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
