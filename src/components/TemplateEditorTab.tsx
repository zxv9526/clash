import React, { useState, useEffect } from 'react';
import { load } from 'js-yaml';
import { FileCode2, Copy, Check, Download, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { DEFAULT_TEMPLATE_YAML } from '../utils/defaults';
import { downloadTextFile } from '../utils/zipExporter';

interface TemplateEditorTabProps {
  templateYaml: string;
  setTemplateYaml: (yamlStr: string) => void;
}

export const TemplateEditorTab: React.FC<TemplateEditorTabProps> = ({
  templateYaml,
  setTemplateYaml,
}) => {
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [detectedGroups, setDetectedGroups] = useState<string[]>([]);

  // Validate YAML on change
  useEffect(() => {
    try {
      const doc: any = load(templateYaml);
      if (doc && typeof doc === 'object') {
        setValidationError(null);
        if (Array.isArray(doc['proxy-groups'])) {
          const groups = doc['proxy-groups'].map((g: any) => g.name || 'Unnamed Group');
          setDetectedGroups(groups);
        } else {
          setDetectedGroups([]);
        }
      } else {
        setValidationError('YAML 结构必须为合法的键值对象');
      }
    } catch (err: any) {
      setValidationError(err.message || 'YAML 语法有误');
      setDetectedGroups([]);
    }
  }, [templateYaml]);

  const handleCopy = () => {
    navigator.clipboard.writeText(templateYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTextFile('template.yaml', templateYaml);
  };

  const handleReset = () => {
    if (confirm('确定恢复为初始 YAML 模板吗？当前编辑的内容将被覆盖。')) {
      setTemplateYaml(DEFAULT_TEMPLATE_YAML);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileCode2 className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Clash / Meta 配置文件模板 (template.yaml)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              工作流在提取 12 个节点后，会自动将节点注入到 <code className="text-indigo-300 font-mono bg-indigo-950/50 px-1 py-0.5 rounded">proxies:</code> 列表中，并自动将节点名称同步到各策略分流组中。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制模板'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 template.yaml</span>
            </button>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>恢复默认模板</span>
            </button>
          </div>
        </div>

        {/* Status / Syntax check */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {validationError ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>YAML 语法错误: {validationError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>YAML 语法校验通过，已识别 {detectedGroups.length} 个策略组</span>
            </div>
          )}
        </div>
      </div>

      {/* Detected Proxy Groups Preview */}
      {detectedGroups.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>模板中检测到的策略分流组（抓取后将自动注入节点名）：</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detectedGroups.map((group, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300"
              >
                {group}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Editor Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="text-xs font-mono text-slate-400 ml-2">template.yaml</span>
          </div>
          <span className="text-[11px] text-slate-500">支持自由编辑规则、DNS及策略组</span>
        </div>

        <textarea
          value={templateYaml}
          onChange={e => setTemplateYaml(e.target.value)}
          rows={28}
          spellCheck={false}
          className="w-full bg-slate-950 text-indigo-100 font-mono text-xs sm:text-sm p-4 focus:outline-none resize-y leading-relaxed selection:bg-indigo-500/30"
          placeholder="在此粘贴或编辑 YAML 模板..."
        />
      </div>
    </div>
  );
};
