import { publicToolName } from './mcp.js';

const FALLBACK_INPUT_SCHEMA = Object.freeze({
  type: 'object',
  properties: {},
  additionalProperties: true,
});

function normalizeInputSchema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return { ...FALLBACK_INPUT_SCHEMA, properties: {} };
  }
  const normalized = { ...schema };
  if (normalized.type === undefined) normalized.type = 'object';
  if (normalized.properties === undefined) normalized.properties = {};
  if (normalized.additionalProperties === undefined && normalized.type === 'object') {
    normalized.additionalProperties = true;
  }
  return normalized;
}

function textFromContent(content) {
  const parts = [];
  for (const block of Array.isArray(content) ? content : []) {
    if (block && block.type === 'text' && typeof block.text === 'string') {
      parts.push(block.text);
    } else if (block && block.type === 'resource' && typeof block.resource?.text === 'string') {
      parts.push(block.resource.text);
    } else if (block !== undefined) {
      try {
        parts.push(JSON.stringify(block));
      } catch {
        parts.push(String(block));
      }
    }
  }
  return parts.join('\n');
}

function renderValue(value) {
  const text = textFromContent(value?.content);
  if (text !== '') return text;
  if (value && value.structuredContent !== undefined) {
    try {
      return JSON.stringify(value.structuredContent, null, 2);
    } catch {
      return String(value.structuredContent);
    }
  }
  return '(Nezha MCP 工具没有返回内容)';
}

/**
 * Adapt one upstream Nezha MCP tool to a DSH ToolDefinition.
 * `callTool(rawName, args, signal)` always uses the service's current client,
 * so a reconnected generation never leaves a tool bound to a dead transport.
 */
export function createToolDefinition({ tool, callTool, timeoutMs }) {
  const rawName = String(tool.name);
  const publicName = publicToolName(rawName);
  const description = typeof tool.description === 'string' && tool.description.trim() !== ''
    ? tool.description.trim()
    : `Nezha MCP 工具：${rawName}`;

  return {
    name: publicName,
    description,
    parameters: normalizeInputSchema(tool.inputSchema),
    output: {
      schema: {
        type: 'object',
        properties: {
          content: { type: 'array', items: {} },
          structuredContent: {},
        },
        required: ['content'],
        additionalProperties: false,
      },
      render(_args, value) {
        return [{ type: 'text', text: renderValue(value) }];
      },
    },
    timeoutMs,
    async execute(args, exec) {
      const result = await callTool(rawName, args, exec.signal);
      if (result?.isError === true) {
        const detail = textFromContent(result.content).trim();
        throw new Error(detail || `Nezha MCP 工具 ${rawName} 执行失败。`);
      }
      const value = {
        content: Array.isArray(result?.content) ? result.content : [],
      };
      if (result?.structuredContent !== undefined) value.structuredContent = result.structuredContent;
      return value;
    },
  };
}
