import test from 'node:test';
import assert from 'node:assert/strict';
import { createToolDefinition } from '../src/tool-bridge.js';

test('createToolDefinition maps an MCP tool to a DSH tool', async () => {
  const calls = [];
  const definition = createToolDefinition({
    tool: {
      name: 'server.list',
      description: 'List the servers visible to this token.',
      inputSchema: { type: 'object', properties: { online_only: { type: 'boolean' } } },
    },
    timeoutMs: 12_000,
    async callTool(rawName, args, signal) {
      calls.push({ rawName, args, signal });
      return {
        content: [{ type: 'text', text: '{"servers":[]}' }],
        structuredContent: { servers: [] },
      };
    },
  });

  assert.equal(definition.name, 'mcp__nezha__server_list');
  assert.equal(definition.description, 'List the servers visible to this token.');
  assert.equal(definition.parameters.type, 'object');
  assert.equal(definition.timeoutMs, 12_000);

  const controller = new AbortController();
  const value = await definition.execute({ online_only: true }, { signal: controller.signal });
  assert.deepEqual(value, { content: [{ type: 'text', text: '{"servers":[]}' }], structuredContent: { servers: [] } });
  assert.equal(calls[0].rawName, 'server.list');
  assert.deepEqual(calls[0].args, { online_only: true });

  const blocks = definition.output.render({}, value);
  assert.deepEqual(blocks, [{ type: 'text', text: '{"servers":[]}' }]);
});

test('tool errors surface as ordinary tool failures', async () => {
  const definition = createToolDefinition({
    tool: { name: 'server.exec', inputSchema: { type: 'object', properties: {} } },
    timeoutMs: 1_000,
    async callTool() {
      return { content: [{ type: 'text', text: 'permission denied' }], isError: true };
    },
  });
  await assert.rejects(definition.execute({}, { signal: new AbortController().signal }), /permission denied/);
});

test('renderValue falls back to structuredContent', async () => {
  const definition = createToolDefinition({
    tool: { name: 'meta.whoami', inputSchema: undefined },
    timeoutMs: 1_000,
    async callTool() {
      return { content: [], structuredContent: { user_id: 1 } };
    },
  });
  const value = await definition.execute({}, { signal: new AbortController().signal });
  assert.equal(definition.output.render({}, value)[0].text, '{\n  "user_id": 1\n}');
  assert.equal(definition.parameters.type, 'object');
});
