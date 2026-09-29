import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw, Upload, Download, ExternalLink, CheckCircle, AlertCircle, Copy, Check, Sparkles, Layers } from 'lucide-react';
import { UrlItem } from '../types';
import { extractUrlsFromText, formatUrlsToTxt } from '../utils/urlExtractor';
import { INITIAL_12_URLS } from '../utils/defaults';
import { downloadTextFile } from '../utils/zipExporter';

interface UrlExtractorTabProps {
  urls: UrlItem[];
  setUrls: React.Dispatch<React.SetStateAction<UrlItem[]>>;
  onTestSingleUrl: (id: string) => Promise<void>;
  isTestingId: string | null;
}

export const UrlExtractorTab: React.FC<UrlExtractorTabProps> = ({
  urls,
  setUrls,
  onTestSingleUrl,
  isTestingId,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Handle batch import from text or bat script
  const handleBatchImport = () => {
    if (!importText.trim()) return;
    const extracted = extractUrlsFromText(importText);
    if (extracted.length > 0) {
      setUrls(extracted);
      setShowImportModal(false);
      setImportText('');
    } else {
      alert('未能在粘贴的文本中识别到有效的 HTTP/HTTPS URL，请检查格式！');
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('确定要重置为默认的 12 个节点订阅源吗？当前所作的修改将被覆盖。')) {
      setUrls(INITIAL_12_URLS);
    }
  };

  const handleAddUrl = () => {
    const nextNum = urls.length + 1;
    const pad = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const newItem: UrlItem = {
      id: `url-custom-${Date.now()}`,
      index: nextNum,
      name: `节点源 #${pad}`,
      primaryUrl: `https://gitlab.com/free9999/ipupdate/-/raw/master/backup/img/1/2/ip/clash.meta2/${nextNum}/config.yaml`,
      mirrorUrl: `https://www.67867867.xyz/Alvin9999/PAC/refs/heads/master/backup/img/1/2/ip/clash.meta2/${nextNum}/config.yaml`,
      status: 'idle',
    };
    setUrls([...urls, newItem]);
  };

  const handleDeleteUrl = (id: string) => {
    const filtered = urls.filter(u => u.id !== id).map((u, i) => ({
      ...u,
      index: i + 1,
      name: `节点源 #${i + 1 < 10 ? '0' + (i + 1) : i + 1}`,
    }));
    setUrls(filtered);
  };

  const handleUpdateUrl = (id: string, field: 'primaryUrl' | 'mirrorUrl' | 'name', value: string) => {
    setUrls(urls.map(u => (u.id === id ? { ...u, [field]: value } : u)));
  };

  const handleCopyTxt = () => {
    const txt = formatUrlsToTxt(urls);
    navigator.clipboard.writeText(txt);
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2000);
  };

  const handleDownloadTxt = () => {
    const txt = formatUrlsToTxt(urls);
    downloadTextFile('urls.txt', txt);
  };

  const filteredUrls = urls.filter(
    u =>
      u.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.primaryUrl.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (u.mirrorUrl && u.mirrorUrl.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                12 节点源 URL 管理器
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                共 {urls.length} 个
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              工作流将依次从这 {urls.length} 个地址获取节点配置。支持主地址（GitLab）及备用镜像（海外/免翻墙镜像）双通道。
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>批量导入 / 提取文本</span>
            </button>

            <button
              onClick={handleCopyTxt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              {copiedTxt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTxt ? '已复制 urls.txt' : '复制 urls.txt'}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 urls.txt</span>
            </button>

            <button
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-all"
              title="重置为默认 12 个节点源"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>恢复默认12源</span>
            </button>
          </div>
        </div>
      </div>

      {/* URL List Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 px-1">
          <input
            type="text"
            placeholder="搜索节点编号或 URL..."
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            className="w-full max-w-xs bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleAddUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加节点 URL</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredUrls.map((item, idx) => {
            const isTesting = isTestingId === item.id;
            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 sm:p-4 transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleUpdateUrl(item.id, 'name', e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 text-xs sm:text-sm font-semibold text-white focus:outline-none px-1 py-0.5 rounded transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {item.status === 'success' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {item.usedSource === 'mirror' ? '镜像提取成功' : '主地址提取成功'} ({item.fetchDurationMs}ms)
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        提取失败: {item.errorMsg || '无法连通'}
                      </span>
                    )}
                    {item.status === 'idle' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400">
                        待抓取
                      </span>
                    )}

                    {/* Test Button */}
                    <button
                      onClick={() => onTestSingleUrl(item.id)}
                      disabled={isTesting}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-400 border border-slate-700 transition-all text-xs"
                      title="单独测试抓取此节点"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-400' : ''}`} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteUrl(item.id)}
                      className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/50 transition-all"
                      title="删除此节点源"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      主订阅源 (GitLab / 主站点):
                    </span>
                    <a
                      href={item.primaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
                    >
                      浏览器打开 <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={item.primaryUrl}
                    onChange={e => handleUpdateUrl(item.id, 'primaryUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-indigo-200 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Mirror URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      备用镜像源 (国内直连/加速镜像，主源失败时自动切换):
                    </span>
                    {item.mirrorUrl && (
                      <a
                        href={item.mirrorUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
                      >
                        浏览器打开 <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.mirrorUrl || ''}
                    onChange={e => handleUpdateUrl(item.id, 'mirrorUrl', e.target.value)}
                    placeholder="可选，备用镜像 URL..."
                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* Extracted proxy summary if available */}
                {item.extractedProxy && (
                  <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/30 text-xs text-emerald-300/90 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-semibold text-emerald-200">已解析节点:</span>
                    <span>类型: <code className="bg-emerald-900/40 px-1 py-0.5 rounded text-[11px] uppercase">{item.extractedProxy.type}</code></span>
                    <span>服务器: <code className="bg-emerald-900/40 px-1 py-0.5 rounded text-[11px] font-mono">{item.extractedProxy.server}:{item.extractedProxy.port}</code></span>
                    {item.extractedProxy.sni && <span>SNI: <code className="bg-emerald-900/40 px-1 py-0.5 rounded text-[11px]">{item.extractedProxy.sni}</code></span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  批量导入与智能提取 URL
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              直接粘贴你的 <strong>.bat 批处理脚本代码</strong>、<strong>urls.txt 文本</strong> 或 <strong>包含 URL 的任何文本</strong>。系统会自动提取出所有的节点 URL，并自动识别 GitLab 主地址与备用镜像！
            </p>

            <textarea
              rows={10}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="例如粘贴：&#10;..\..\wget -t 2 --no-hsts https://gitlab.com/.../clash.meta2/1/config.yaml&#10;..\..\wget -t 2 --no-hsts https://www.67867867.xyz/.../clash.meta2/1/config.yaml&#10;..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleBatchImport}
                disabled={!importText.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
              >
                智能解析并导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
