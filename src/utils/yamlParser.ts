import { load, dump } from 'js-yaml';
import { MergeResult, NamingConfig, ProxyNode } from '../types';

/**
 * Format a proxy node's name based on user's naming settings
 */
export function formatNodeName(
  proxy: ProxyNode,
  index: number,
  namingConfig: NamingConfig
): string {
  const padIndex = index < 10 ? `0${index}` : `${index}`;
  const protocol = (proxy.type || 'unknown').toUpperCase();
  const server = proxy.server || 'server';

  switch (namingConfig.mode) {
    case 'sequential':
      return `${namingConfig.prefix || '节点'} ${padIndex}`;

    case 'ip_protocol':
      return `${padIndex}-${protocol}-${server}`;

    case 'custom_prefix': {
      let name = `${namingConfig.prefix} ${padIndex}`;
      if (namingConfig.includeProtocol) {
        name += ` [${protocol}]`;
      }
      if (namingConfig.includeIp) {
        name += ` (${server})`;
      }
      return name;
    }

    case 'original':
    default:
      // If original name is empty or generic, use indexed name
      if (!proxy.name || proxy.name.trim() === '' || proxy.name === 'github.com/Alvin9999-newpac/fanqiang') {
        return `${padIndex}-${protocol}-${server}`;
      }
      return `${padIndex}-${proxy.name}`;
  }
}

/**
 * Extract proxy list from raw YAML string
 */
export function extractProxiesFromYaml(rawYaml: string): ProxyNode[] {
  if (!rawYaml || !rawYaml.trim()) return [];

  try {
    const doc: any = load(rawYaml);
    if (!doc || typeof doc !== 'object') {
      return fallbackRegexExtract(rawYaml);
    }

    if (Array.isArray(doc.proxies) && doc.proxies.length > 0) {
      return doc.proxies.filter((p: any) => p && typeof p === 'object' && p.server && p.type);
    }

    // Sometimes single proxy is placed directly
    if (doc.server && doc.type) {
      return [doc as ProxyNode];
    }
  } catch {
    return fallbackRegexExtract(rawYaml);
  }

  return [];
}

/**
 * Fallback regex extractor if YAML has minor syntax anomalies
 */
function fallbackRegexExtract(rawYaml: string): ProxyNode[] {
  const proxies: ProxyNode[] = [];
  try {
    const serverMatch = rawYaml.match(/server:\s*["']?([^\s"'\n]+)/i);
    const portMatch = rawYaml.match(/port:\s*(\d+)/i);
    const typeMatch = rawYaml.match(/type:\s*["']?([^\s"'\n]+)/i);

    if (serverMatch && portMatch && typeMatch) {
      const passwordMatch = rawYaml.match(/password:\s*["']?([^\s"'\n]+)/i);
      const sniMatch = rawYaml.match(/sni:\s*["']?([^\s"'\n]+)/i);
      const skipCertMatch = rawYaml.match(/skip-cert-verify:\s*(true|false)/i);
      const upMatch = rawYaml.match(/up:\s*["']?([^"'\n]+)["']?/i);
      const downMatch = rawYaml.match(/down:\s*["']?([^"'\n]+)["']?/i);

      proxies.push({
        name: `Extracted-Node-${serverMatch[1]}`,
        type: typeMatch[1],
        server: serverMatch[1],
        port: parseInt(portMatch[1], 10),
        password: passwordMatch ? passwordMatch[1] : undefined,
        sni: sniMatch ? sniMatch[1] : undefined,
        'skip-cert-verify': skipCertMatch ? skipCertMatch[1].toLowerCase() === 'true' : true,
        up: upMatch ? upMatch[1].trim() : undefined,
        down: downMatch ? downMatch[1].trim() : undefined,
      });
    }
  } catch {
    // Ignore error
  }
  return proxies;
}

/**
 * Merge extracted proxies into the YAML template
 */
export function mergeNodesIntoTemplate(
  templateYaml: string,
  rawProxies: ProxyNode[],
  namingConfig: NamingConfig
): MergeResult {
  const errors: string[] = [];
  const groupsUpdated: string[] = [];

  if (!templateYaml.trim()) {
    return {
      yaml: '',
      nodesCount: 0,
      proxies: [],
      groupsUpdated: [],
      errors: ['模板 YAML 为空，无法生成配置'],
    };
  }

  let templateDoc: any;
  try {
    templateDoc = load(templateYaml);
  } catch (err: any) {
    return {
      yaml: '',
      nodesCount: 0,
      proxies: [],
      groupsUpdated: [],
      errors: [`模板 YAML 语法解析错误: ${err.message}`],
    };
  }

  if (!templateDoc || typeof templateDoc !== 'object') {
    return {
      yaml: '',
      nodesCount: 0,
      proxies: [],
      groupsUpdated: [],
      errors: ['模板 YAML 必须为有效的根对象'],
    };
  }

  // Rename and format proxies
  const processedProxies: ProxyNode[] = rawProxies.map((p, idx) => {
    const formattedName = formatNodeName(p, idx + 1, namingConfig);
    return {
      ...p,
      name: formattedName,
    };
  });

  const nodeNames = processedProxies.map(p => p.name);

  // 1. Assign to proxies
  templateDoc.proxies = processedProxies;

  // 2. Update proxy-groups
  if (Array.isArray(templateDoc['proxy-groups'])) {
    templateDoc['proxy-groups'] = templateDoc['proxy-groups'].map((group: any) => {
      if (!group || typeof group !== 'object') return group;

      const groupName = group.name || '';
      const existingProxies: string[] = Array.isArray(group.proxies) ? group.proxies : [];

      // Determine if this group should include dynamic proxy nodes
      // Groups that shouldn't include individual nodes: pure reject / filter groups if they only have DIRECT/REJECT
      const isRejectOnly = existingProxies.length === 2 && existingProxies.includes('REJECT') && existingProxies.includes('DIRECT') && !existingProxies.some(p => p.includes('节点') || p.includes('fanqiang'));

      // Check if group already had proxies or should receive them
      const isSelectOrFallback = ['select', 'fallback', 'url-test', 'load-balance'].includes(group.type);

      if (isSelectOrFallback && !isRejectOnly) {
        // Keep non-node static options (like DIRECT, REJECT, other group references like 🚀 节点选择, ♻️ 自动选择)
        const staticEntries = existingProxies.filter(p => {
          // If it matches previous Alvin fanqiang node or placeholder, remove it
          if (p.includes('fanqiang') || p.includes('github.com/')) return false;
          // If it was previous dynamic node, remove it
          if (p.startsWith('节点') || p.match(/^\d{2}-/)) return false;
          return true;
        });

        // Insert new node names after group references or at designated positions
        const mergedGroupProxies = Array.from(new Set([...staticEntries, ...nodeNames]));
        groupsUpdated.push(groupName);

        return {
          ...group,
          proxies: mergedGroupProxies,
        };
      }

      return group;
    });
  }

  // Serialize back to clean YAML
  try {
    const generatedYaml = dump(templateDoc, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      forceQuotes: false,
    });

    return {
      yaml: generatedYaml,
      nodesCount: processedProxies.length,
      proxies: processedProxies,
      groupsUpdated,
      errors,
    };
  } catch (err: any) {
    return {
      yaml: '',
      nodesCount: 0,
      proxies: [],
      groupsUpdated: [],
      errors: [`生成 YAML 失败: ${err.message}`],
    };
  }
}
