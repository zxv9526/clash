export interface ProxyNode {
  name: string;
  type: string;
  server: string;
  port: number;
  password?: string;
  uuid?: string;
  cipher?: string;
  sni?: string;
  'skip-cert-verify'?: boolean;
  up?: string;
  down?: string;
  alpn?: string[];
  network?: string;
  'client-fingerprint'?: string;
  [key: string]: any;
}

export interface UrlItem {
  id: string;
  index: number;
  name: string;
  primaryUrl: string;
  mirrorUrl?: string;
  status: 'idle' | 'fetching' | 'success' | 'fallback_success' | 'failed';
  errorMsg?: string;
  extractedProxy?: ProxyNode;
  rawYaml?: string;
  fetchDurationMs?: number;
  usedSource?: 'primary' | 'mirror' | 'sample';
}

export interface NamingConfig {
  mode: 'sequential' | 'original' | 'ip_protocol' | 'custom_prefix';
  prefix: string; // e.g. "节点" or "MetaNode"
  includeProtocol: boolean;
  includeIp: boolean;
}

export interface WorkflowOptions {
  cronSchedule: string; // e.g. "0 */6 * * *"
  targetBranch: string; // e.g. "main"
  outputFileName: string; // e.g. "config.yaml"
  enableGitHubPages: boolean;
  enableReleaseUpload: boolean;
  scriptLanguage: 'python' | 'nodejs';
  timeoutSeconds: number;
  retries: number;
}

export interface MergeResult {
  yaml: string;
  nodesCount: number;
  proxies: ProxyNode[];
  groupsUpdated: string[];
  errors: string[];
}
