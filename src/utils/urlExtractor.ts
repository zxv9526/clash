import { UrlItem } from '../types';

/**
 * Extracts URLs from raw text, bat scripts, shell scripts, markdown, etc.
 * Pairs up mirror URLs if detected.
 */
export function extractUrlsFromText(inputText: string): UrlItem[] {
  if (!inputText.trim()) return [];

  // Look for all http/https URLs
  const urlRegex = /(https?:\/\/[^\s"'<>`\\]+)/gi;
  const matches = inputText.match(urlRegex) || [];

  // Filter out non-yaml and common false positives if any, but keep all valid URLs
  const cleanUrls = matches.map(u => u.trim().replace(/[.,;:)\]]+$/, ''));
  const uniqueUrls = Array.from(new Set(cleanUrls));

  if (uniqueUrls.length === 0) return [];

  // Detect paired primary / mirror URLs
  // For example: gitlab.com/.../clash.meta2/1/config.yaml and 67867867.xyz/.../clash.meta2/1/config.yaml
  const groupedByNodeNum = new Map<number, { primary?: string; mirror?: string }>();
  const unclassifiedUrls: string[] = [];

  for (const url of uniqueUrls) {
    const metaMatch = url.match(/clash\.meta2\/(\d+)\/config\.yaml/i);
    if (metaMatch) {
      const num = parseInt(metaMatch[1], 10);
      const existing = groupedByNodeNum.get(num) || {};
      if (url.includes('gitlab.com')) {
        existing.primary = url;
      } else if (url.includes('67867867') || url.includes('github') || url.includes('raw')) {
        existing.mirror = url;
      } else {
        if (!existing.primary) existing.primary = url;
        else if (!existing.mirror) existing.mirror = url;
      }
      groupedByNodeNum.set(num, existing);
    } else {
      unclassifiedUrls.push(url);
    }
  }

  const result: UrlItem[] = [];
  let index = 1;

  if (groupedByNodeNum.size > 0) {
    const sortedKeys = Array.from(groupedByNodeNum.keys()).sort((a, b) => a - b);
    for (const num of sortedKeys) {
      const item = groupedByNodeNum.get(num)!;
      result.push({
        id: `url-${num}-${Date.now()}`,
        index: index++,
        name: `节点源 #${num < 10 ? '0' + num : num}`,
        primaryUrl: item.primary || item.mirror || '',
        mirrorUrl: item.mirror && item.primary !== item.mirror ? item.mirror : undefined,
        status: 'idle',
      });
    }
  }

  // Append remaining unclassified URLs
  for (const url of unclassifiedUrls) {
    result.push({
      id: `url-raw-${index}-${Date.now()}`,
      index: index++,
      name: `节点源 #${index < 10 ? '0' + index : index}`,
      primaryUrl: url,
      status: 'idle',
    });
  }

  return result;
}

/**
 * Format URLs to plain text for export / urls.txt
 */
export function formatUrlsToTxt(items: UrlItem[]): string {
  let output = `# Clash/Meta 节点订阅源列表 (${items.length} 个 URL)\n`;
  output += `# 每一行代表一个节点的 YAML 远程订阅地址\n`;
  output += `# 支持主地址与镜像备用地址 (格式: 主URL | 备用URL)\n\n`;

  items.forEach((item, i) => {
    const num = i + 1;
    if (item.mirrorUrl) {
      output += `# 节点 ${num < 10 ? '0' + num : num}\n`;
      output += `${item.primaryUrl} | ${item.mirrorUrl}\n\n`;
    } else {
      output += `${item.primaryUrl}\n`;
    }
  });

  return output.trim() + '\n';
}

/**
 * Parse urls.txt format back into UrlItem list
 */
export function parseUrlsTxt(text: string): UrlItem[] {
  const lines = text.split('\n');
  const items: UrlItem[] = [];
  let index = 1;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split('|').map(s => s.trim());
    const primaryUrl = parts[0];
    const mirrorUrl = parts[1];

    if (primaryUrl && primaryUrl.startsWith('http')) {
      const padIndex = index < 10 ? `0${index}` : `${index}`;
      items.push({
        id: `url-parsed-${index}-${Date.now()}`,
        index: index++,
        name: `节点源 #${padIndex}`,
        primaryUrl,
        mirrorUrl: mirrorUrl && mirrorUrl.startsWith('http') ? mirrorUrl : undefined,
        status: 'idle',
      });
    }
  }

  return items;
}
