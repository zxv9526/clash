import React from 'react';
import { Play, Download, Settings, Github, RefreshCw, FileText, CheckCircle2, Globe, BookOpen } from 'lucide-react';
import { UrlItem } from '../types';

interface HeaderProps {
  activeTab: 'generator' | 'urls' | 'template' | 'github' | 'guide';
  setActiveTab: (tab: 'generator' | 'urls' | 'template' | 'github' | 'guide') => void;
  urls: UrlItem[];
  isRunning: boolean;
  onRunGeneration: () => void;
  onDownloadZip: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  urls,
  isRunning,
  onRunGeneration,
  onDownloadZip,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <RefreshCw className={`w-5 h-5 text-cyan-400 ${isRunning ? 'animate-spin' : ''}`} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 truncate">
                  Clash 12节点自动聚合工作流
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {urls.length} 个节点源
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate">
                从 TXT/脚本提取 12 个 URL 自动获取节点并套用 YAML 模板生成配置
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onRunGeneration}
              disabled={isRunning}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md ${
                isRunning
                  ? 'bg-indigo-600/50 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-indigo-500/25 active:scale-95'
              }`}
            >
              <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : 'fill-current'}`} />
              <span>{isRunning ? '正在抓取合并...' : '在线生成配置'}</span>
            </button>

            <button
              onClick={onDownloadZip}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              title="下载完整 GitHub 工作流仓库压缩包"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">导出 GitHub 项目</span>
              <span className="md:hidden">导出</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-all"
              title="配置命名规则与定时任务参数"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-slate-800/80 pt-1 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              activeTab === 'generator'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>在线调试与预览</span>
          </button>

          <button
            onClick={() => setActiveTab('urls')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              activeTab === 'urls'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>12个 URL 订阅源管理 ({urls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              activeTab === 'template'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>YAML 模板配置</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              activeTab === 'github'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Actions 工作流源码</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
              activeTab === 'guide'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>部署与订阅教程</span>
          </button>
        </div>

      </div>
    </header>
  );
};
