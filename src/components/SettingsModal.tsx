import React from 'react';
import { Settings, X, Save, RefreshCw, Sliders, Clock, GitBranch, Shield, Sparkles } from 'lucide-react';
import { NamingConfig, WorkflowOptions } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  namingConfig: NamingConfig;
  setNamingConfig: React.Dispatch<React.SetStateAction<NamingConfig>>;
  workflowOptions: WorkflowOptions;
  setWorkflowOptions: React.Dispatch<React.SetStateAction<WorkflowOptions>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  namingConfig,
  setNamingConfig,
  workflowOptions,
  setWorkflowOptions,
}) => {
  if (!isOpen) return null;

  // Sample preview of node name
  let previewName = `${namingConfig.prefix || '节点'} 01`;
  if (namingConfig.includeProtocol) previewName += ' [HYSTERIA2]';
  if (namingConfig.includeIp) previewName += ' (62.210.124.132)';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-5 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">工作流与节点命名定制</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Node Naming Rules */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">节点自动重命名规则</h4>
          </div>
          <p className="text-xs text-slate-400">
            自动重命名可防止 12 个节点由于名称相同导致 Clash 客户端报错或只识别 1 个节点。
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-300 font-medium w-24">节点前缀名称:</label>
              <input
                type="text"
                value={namingConfig.prefix}
                onChange={e => setNamingConfig({ ...namingConfig, prefix: e.target.value })}
                placeholder="例如: 节点"
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-44 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={namingConfig.includeProtocol}
                  onChange={e => setNamingConfig({ ...namingConfig, includeProtocol: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>附带协议标签 (如 [HYSTERIA2])</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={namingConfig.includeIp}
                  onChange={e => setNamingConfig({ ...namingConfig, includeIp: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>附带服务器 IP (如 (62.210.124.132))</span>
              </label>
            </div>

            {/* Live Name Preview */}
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs flex items-center justify-between">
              <span className="text-indigo-300 font-medium">生成效果预览:</span>
              <code className="text-emerald-300 font-mono font-semibold bg-slate-950/60 px-2 py-0.5 rounded">
                {previewName}
              </code>
            </div>
          </div>
        </div>

        {/* Section 2: GitHub Actions Workflow Settings */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">GitHub Actions 自动化定时参数</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">定时更新 Cron 表达式</label>
              <select
                value={workflowOptions.cronSchedule}
                onChange={e => setWorkflowOptions({ ...workflowOptions, cronSchedule: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-indigo-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="0 */3 * * *">每 3 小时更新一次 (0 */3 * * *)</option>
                <option value="0 */6 * * *">每 6 小时更新一次 (推荐: 0 */6 * * *)</option>
                <option value="0 */12 * * *">每 12 小时更新一次 (0 */12 * * *)</option>
                <option value="0 4 * * *">每天凌晨 4 点更新一次 (0 4 * * *)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">目标分支 (Target Branch)</label>
              <input
                type="text"
                value={workflowOptions.targetBranch}
                onChange={e => setWorkflowOptions({ ...workflowOptions, targetBranch: e.target.value })}
                placeholder="main"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={workflowOptions.enableGitHubPages}
                onChange={e => setWorkflowOptions({ ...workflowOptions, enableGitHubPages: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>同时部署至 GitHub Pages 分支 (提供独立域名加速直链)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={workflowOptions.enableReleaseUpload}
                onChange={e => setWorkflowOptions({ ...workflowOptions, enableReleaseUpload: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>同时发布为 Release 附件 (固定下载永久链接)</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95"
          >
            完成并保存设置
          </button>
        </div>
      </div>
    </div>
  );
};
