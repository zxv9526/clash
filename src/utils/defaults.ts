import { NamingConfig, UrlItem, WorkflowOptions } from '../types';

export const DEFAULT_TEMPLATE_YAML = `secret: github.com/Alvin9999-newpac/fanqiang
mixed-port: 7890
allow-lan: false
log-level: info
dns:
  enabled: true
  nameserver:
    - 119.29.29.29
    - 223.5.5.5
  fallback-filter:
    geoip: false
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32
proxies:
  # 自动提取的12个节点将插入在此处
proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies:
      - ♻️ 自动选择
      - DIRECT
  - name: ♻️ 自动选择
    type: fallback
    url: "https://www.gstatic.com/generate_204"
    interval: 5
    proxies: []
  - name: 🌍 国外媒体
    type: select
    proxies:
      - 🚀 节点选择
      - ♻️ 自动选择
      - 🎯 全球直连
  - name: 📲 电报信息
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
  - name: Ⓜ️ 微软服务
    type: select
    proxies:
      - 🎯 全球直连
      - 🚀 节点选择
  - name: 🍎 苹果服务
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
  - name: 🎯 全球直连
    type: select
    proxies:
      - DIRECT
      - 🚀 节点选择
      - ♻️ 自动选择
  - name: 🛑 全球拦截
    type: select
    proxies:
      - REJECT
      - DIRECT
  - name: 🍃 应用净化
    type: select
    proxies:
      - REJECT
      - DIRECT
  - name: 🐟 漏网之鱼
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
      - ♻️ 自动选择
rules:
  - MATCH,🚀 节点选择
`;

export const INITIAL_12_URLS: UrlItem[] = Array.from({ length: 12 }, (_, idx) => {
  const num = idx + 1;
  return {
    id: `url-${num}`,
    index: num,
    name: `节点源 #${num < 10 ? '0' + num : num}`,
    primaryUrl: `https://gitlab.com/free9999/ipupdate/-/raw/master/backup/img/1/2/ip/clash.meta2/${num}/config.yaml`,
    mirrorUrl: `https://www.67867867.xyz/Alvin9999/PAC/refs/heads/master/backup/img/1/2/ip/clash.meta2/${num}/config.yaml`,
    status: 'idle',
  };
});

export const SAMPLE_PROXIES = [
  {
    name: "01-Hysteria2-62.210.124.132",
    type: "hysteria2",
    server: "62.210.124.132",
    port: 64772,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "11 Mbps",
    down: "55 Mbps"
  },
  {
    name: "02-Hysteria2-198.244.156.88",
    type: "hysteria2",
    server: "198.244.156.88",
    port: 58921,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "15 Mbps",
    down: "60 Mbps"
  },
  {
    name: "03-Hysteria2-141.95.123.45",
    type: "hysteria2",
    server: "141.95.123.45",
    port: 43210,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "microsoft.com",
    "skip-cert-verify": true,
    up: "10 Mbps",
    down: "50 Mbps"
  },
  {
    name: "04-Hysteria2-51.159.201.76",
    type: "hysteria2",
    server: "51.159.201.76",
    port: 39812,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "12 Mbps",
    down: "65 Mbps"
  },
  {
    name: "05-Hysteria2-104.244.75.12",
    type: "hysteria2",
    server: "104.244.75.12",
    port: 52140,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "apple.com",
    "skip-cert-verify": true,
    up: "20 Mbps",
    down: "80 Mbps"
  },
  {
    name: "06-Hysteria2-178.32.90.11",
    type: "hysteria2",
    server: "178.32.90.11",
    port: 61120,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "11 Mbps",
    down: "55 Mbps"
  },
  {
    name: "07-Hysteria2-185.193.125.44",
    type: "hysteria2",
    server: "185.193.125.44",
    port: 48920,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "14 Mbps",
    down: "70 Mbps"
  },
  {
    name: "08-Hysteria2-194.38.20.155",
    type: "hysteria2",
    server: "194.38.20.155",
    port: 57630,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "cloudflare.com",
    "skip-cert-verify": true,
    up: "16 Mbps",
    down: "75 Mbps"
  },
  {
    name: "09-Hysteria2-212.83.180.99",
    type: "hysteria2",
    server: "212.83.180.99",
    port: 33280,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "18 Mbps",
    down: "85 Mbps"
  },
  {
    name: "10-Hysteria2-95.216.14.77",
    type: "hysteria2",
    server: "95.216.14.77",
    port: 60100,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "20 Mbps",
    down: "90 Mbps"
  },
  {
    name: "11-Hysteria2-65.108.77.23",
    type: "hysteria2",
    server: "65.108.77.23",
    port: 41920,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "15 Mbps",
    down: "65 Mbps"
  },
  {
    name: "12-Hysteria2-168.119.50.88",
    type: "hysteria2",
    server: "168.119.50.88",
    port: 54100,
    password: "github.com/Alvin9999-newpac/fanqiang",
    sni: "bing.com",
    "skip-cert-verify": true,
    up: "12 Mbps",
    down: "60 Mbps"
  }
];

export const DEFAULT_NAMING_CONFIG: NamingConfig = {
  mode: 'custom_prefix',
  prefix: '节点',
  includeProtocol: true,
  includeIp: true,
};

export const DEFAULT_WORKFLOW_OPTIONS: WorkflowOptions = {
  cronSchedule: '0 */6 * * *',
  targetBranch: 'main',
  outputFileName: 'config.yaml',
  enableGitHubPages: true,
  enableReleaseUpload: true,
  scriptLanguage: 'python',
  timeoutSeconds: 15,
  retries: 2,
};
