import JSZip from 'jszip';
import { NamingConfig, UrlItem, WorkflowOptions } from '../types';
import { generateAllProjectFiles } from './githubTemplates';

/**
 * Packs all repository files into a ZIP archive and triggers browser download
 */
export async function downloadGitHubProjectZip(
  urls: UrlItem[],
  templateYaml: string,
  namingConfig: NamingConfig,
  workflowOptions: WorkflowOptions,
  generatedConfigYaml?: string
): Promise<void> {
  const zip = new JSZip();

  const files = generateAllProjectFiles(urls, templateYaml, namingConfig, workflowOptions);

  // Add files to zip
  for (const [filePath, content] of Object.entries(files)) {
    zip.file(filePath, content);
  }

  // Include generated config.yaml if provided
  if (generatedConfigYaml && generatedConfigYaml.trim()) {
    zip.file('config.yaml', generatedConfigYaml);
  }

  // Generate binary zip
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clash-12node-workflow-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download a single text file
 */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
