import React, { useState } from 'react';
import { Play, Download, Copy, Check, CheckCircle2, AlertCircle, RefreshCw, Cpu, Server, Wifi, ExternalLink, ArrowRight, Layers, FileCheck, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { MergeResult, NamingConfig, ProxyNode, UrlItem } from '../types';
import { extractProxiesFromYaml, mergeNodesIntoTemplate } from '../utils/yamlParser';
import { SAMPLE_PROXIES } from '../utils/defaults';
import { downloadTextFile } from '../utils/zipExporter';

interface GeneratorRunnerTabProps {
  urls: UrlItem[];
  templateYaml: string;
  namingConfig: NamingConfig;
  lastResult: MergeResult | null;
  setLastResult: (res: MergeResult | null) => void;
  isRunning: boolean;
  onRunGeneration: () => void;
  onUseSampleNodes: () => void;
}

export const GeneratorRunnerTab: React.FC<GeneratorRunnerTabProps> = ({
  urls,
  templateYaml,
  namingConfig,
  lastResult,
  setLastResult,
  isRunning,
  onRunGeneration,
  onUseSampleNodes,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'yaml' | 'nodes' | 'groups'>('yaml');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodeIndex, setExpandedNodeIndex] = useState<number | null>(null);

  const handleCopyYaml = () => {
    if (!lastResult?.yaml) return;
    navigator.clipboard.writeText(lastResult.yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadYaml = () => {
    if (!lastResult?.yaml) return;
    downloadTextFile('config.yaml', lastResult.yaml);
  };

  const filteredNodes = (lastResult?.proxies || []).filter(
    n =>
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.server.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Run Controller Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Cpu className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  在线抓取与配置生成引擎
                </h2>
                <p className="text-xs text-slate-400">
                  一键并发请求 {urls.length} 个远端订阅源，自动解析 Hysteria2 / Vless 代理节点并注入模板
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRunGeneration}
              disabled={isRunning}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg ${
                isRunning
                  ? 'bg-indigo-600/60 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-indigo-500/30 active:scale-95'
              }`}
            >
              <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : 'fill-current'}`} />
              <span>{isRunning ? '正在提取 12 个节点...' : '立即在线生成 (12节点)'}</span>
            </button>

            <button
              onClick={onUseSampleNodes}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              title="使用预置的 12 个标准 Hysteria2 节点快速模拟生成"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>一键填入演示节点</span>
            </button>
          </div>
        </div>

        {/* Live Nodes status pill summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-4 mt-4 border-t border-slate-800/80">
          {urls.map((u, i) => {
            let statusColor = 'bg-slate-800/60 text-slate-400 border-slate-700/50';
            if (u.status === 'success') statusColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
            if (u.status === 'fetching') statusColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse';
            if (u.status === 'failed') statusColor = 'bg-rose-500/10 text-rose-300 border-rose-500/30';

            return (
              <div
                key={u.id}
                className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between transition-all ${statusColor}`}
              >
                <span className="font-mono font-medium">#{i + 1 < 10 ? `0${i + 1}` : i + 1}</span>
                <span className="text-[11px] truncate max-w-[80px]">
                  {u.status === 'fetching' ? '抓取中...' : u.status === 'success' ? '✓ 就绪' : u.status === 'failed' ? '✗ 失败' : '待处理'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Result Container */}
      {lastResult ? (
        <div className="space-y-4">
          {/* Result summary banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg">
                {lastResult.nodesCount}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>成功生成 Clash 配置文件</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    已注入 {lastResult.nodesCount} 个节点
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  同步更新了 {lastResult.groupsUpdated.length} 个策略组分流列表 (如 🚀 节点选择、♻️ 自动选择等)
                </p>
              </div>
            </div>

            {/* View Switcher & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1">
                <button
                  onClick={() => setViewMode('yaml')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'yaml' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  YAML 源码
                </button>
                <button
                  onClick={() => setViewMode('nodes')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'nodes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  节点列表 ({lastResult.nodesCount})
                </button>
                <button
                  onClick={() => setViewMode('groups')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'groups' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  策略分流组 ({lastResult.groupsUpdated.length})
                </button>
              </div>

              <button
                onClick={handleCopyYaml}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                <span>{copied ? '已复制全部' : '复制 config.yaml'}</span>
              </button>

              <button
                onClick={handleDownloadYaml}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载 config.yaml</span>
              </button>
            </div>
          </div>

          {/* View: YAML Source Code */}
          {viewMode === 'yaml' && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
              <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                  <span className="text-white font-semibold">config.yaml (最终输出配置)</span>
                </div>
                <span>{lastResult.yaml.split('\n').length} 行 | {(new Blob([lastResult.yaml]).size / 1024).toFixed(1)} KB</span>
              </div>
              <pre className="p-4 text-xs sm:text-sm font-mono text-indigo-100 overflow-x-auto max-h-[600px] leading-relaxed selection:bg-indigo-500/30">
                {lastResult.yaml}
              </pre>
            </div>
          )}

          {/* View: Nodes Cards */}
          {viewMode === 'nodes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="搜索已解析节点 (IP/协议/名称)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400">
                  显示 {filteredNodes.length} / {lastResult.proxies.length} 个节点
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNodes.map((node, idx) => {
                  const isExpanded = expandedNodeIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all group shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate block">
                            {node.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Server className="w-3 h-3 text-cyan-400" />
                            {node.server}:{node.port}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                          {node.type}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300/80 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                        {node.sni && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">SNI / 混淆:</span>
                            <span className="font-mono text-slate-300">{node.sni}</span>
                          </div>
                        )}
                        {node.up && node.down && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">上下行带宽:</span>
                            <span className="font-mono text-emerald-400">{node.up} / {node.down}</span>
                          </div>
                        )}
                        {node['skip-cert-verify'] !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">证书跳过:</span>
                            <span className="font-mono text-slate-300">{node['skip-cert-verify'] ? 'true' : 'false'}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setExpandedNodeIndex(isExpanded ? null : idx)}
                        className="w-full text-center text-[11px] text-slate-400 hover:text-indigo-300 flex items-center justify-center gap-1 pt-1"
                      >
                        {isExpanded ? (
                          <>收起完整 JSON <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>展开完整参数 <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>

                      {isExpanded && (
                        <pre className="p-2.5 rounded-lg bg-slate-950 text-[11px] font-mono text-indigo-200 overflow-x-auto">
                          {JSON.stringify(node, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View: Proxy Groups */}
          {viewMode === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastResult.groupsUpdated.map((groupName, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      {groupName}
                    </span>
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ 已注入 12 节点
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    该策略组在客户端选择时将包含所有抓取的 12 个节点，支持快速切换或自动故障转移测速。
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">尚未执行抓取与配置生成</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              点击上方 <strong>“立即在线生成 (12节点)”</strong> 或 <strong>“一键填入演示节点”</strong> 即可在线提取 12 个 URL 并生成完整的 Clash / Meta 配置文件。
            </p>
          </div>
          <button
            onClick={onRunGeneration}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>立即开始生成</span>
          </button>
        </div>
      )}
    </div>
  );
};
