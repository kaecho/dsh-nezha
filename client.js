window.__ModuleLoader__.load({
  id: 'dsh-nezha',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;

    const NS = 'plugins.dshNezha';
    const SERVICE = 'nezhaSettings';
    const inject = ['slots', 'locale', 'remote'];
    const REPOSITORY = 'https://github.com/kaecho/dsh-nezha';
    const OVERLAY_Z_INDEX = '2147483000';

    const zh = {
      routeTitle: '连接路由',
      status_loading: '读取配置…',
      status_idle: '待配置',
      status_disabled: '已停用',
      status_connecting: '连接中…',
      status_connected: '已连接',
      status_error: '连接失败',
      test: '测试连接',
      settings: '连接设置',
      refreshTools: '刷新工具',
      refreshing: '刷新中…',
      retry: '重试连接',
      enable: '启用并连接',
      stripLabel: '连接链路：DeepSeek Harness、哪吒 MCP 与工具',
      banner_idle_title: '还没有连接哪吒监控',
      banner_idle_body: '填写 Dashboard 地址和 API Token（PAT）后，Agent 就能查询服务器、执行命令和读写文件。',
      banner_disabled_title: '插件已停用',
      banner_disabled_body: '停用期间不会注册任何 mcp__nezha__* 工具，Agent 无法访问服务器。',
      banner_error_title: '连接失败',
      banner_token_readonly: 'PAT 已配置，但当前 DSH 凭据服务不可写。',
      savedNotice: '已保存配置，正在重新连接。',
      refreshedNotice: '已重新连接并读取 Nezha 工具列表。',
      enabledNotice: '已启用，正在连接 Nezha。',
      configFile: '配置文件',
      copyPath: '复制路径',
      copied: '已复制',
      patStored: 'PAT 存于凭据库',
      group_servers: '监测服务器',
      group_server: '服务器工具',
      group_fs: '文件工具',
      group_meta: '身份权限',
      group_other: '其他工具',
      tools_count: '{count} 个工具',
      servers_summary: '{online}/{total} 在线',
      servers_none: '未连接',
      servers_empty: 'Nezha 返回了空服务器列表。',
      servers_loading: '正在读取服务器列表…',
      servers_refresh: '刷新服务器状态',
      servers_fetched: '{time} 更新',
      tools_empty: '连接后显示可用工具',
      tools_hint: '工具名为 mcp__nezha__*，对应 Nezha 的原始工具名。',
      server_last_active: '最近活跃：{time}',
      tool_meta_whoami: '令牌身份',
      tool_server_list: '服务器列表',
      tool_server_get: '服务器详情',
      tool_server_exec: '执行命令',
      tool_fs_list: '列目录',
      tool_fs_read: '读文件',
      tool_fs_write: '写文件',
      tool_fs_delete: '删除文件',
      tool_fs_download_url: '下载链接',
      tool_fs_upload_url: '上传链接',
      settingsTitle: '连接设置',
      urlLabel: 'Dashboard 地址',
      urlHint: '填面板根地址或完整的 /mcp 地址，保存时自动补全 /mcp。',
      urlPreview: '将连接到 {endpoint}',
      urlEmptyHint: '留空表示暂时不连接，但会保留已保存的 PAT。',
      urlError_invalid: '地址格式无效，请使用 http:// 或 https:// 开头的完整地址。',
      urlError_protocol: '地址必须以 http:// 或 https:// 开头。',
      urlError_credentials: '地址中不能包含用户名或密码，PAT 请填写在令牌字段。',
      tokenLabel: 'API Token（PAT）',
      tokenSaved: '已保存',
      tokenMissing: '未配置',
      tokenKeep: '已保存，留空表示不修改',
      tokenHint: '在「个人信息 → API 接口」创建 nzp_ 开头的令牌，并只授予需要的 scope。',
      tokenShow: '显示令牌',
      tokenHide: '隐藏令牌',
      timeoutLabel: '请求超时（秒）',
      timeoutHint: '5–300 秒；命令执行等长任务可适当调大。',
      timeoutError: '超时需为 5–300 之间的整数秒。',
      enabledLabel: '启用 Nezha MCP',
      enabledHint: '关闭后不会连接 Nezha，也不会注册任何工具。',
      clearToken: '清除已保存的 PAT',
      clearTokenHint: '保存后生效；清除后状态回到待配置。',
      save: '保存并连接',
      saving: '保存中…',
      cancel: '取消',
      close: '关闭',
      saveFailed: '保存失败，请检查配置后重试。',
      testTitle: '测试连接',
      testIntro: '使用已保存的地址和 PAT 执行一次 MCP initialize 与 tools/list，不会保存或修改配置。',
      testIntroDraft: '测试会读取当前已保存的配置；要测试新地址，请先在连接设置中保存。',
      testStart: '开始测试',
      testAgain: '重新测试',
      testDone: '测试完成',
      testNoConfig: '还没有可测试的配置，请先填写 Dashboard 地址和 PAT。',
      testRunning: '正在测试…',
      testElapsed: '耗时 {value} 秒',
      step_address: '规范化地址',
      step_handshake: 'MCP 握手',
      step_tools: '读取工具列表',
      step_servers: '读取服务器概览',
      step_pending: '等待执行',
      step_skipped: '未执行',
      step_running: '进行中…',
      step_failed: '失败',
      result_server: '服务器',
      result_protocol: '协议版本',
      result_tools: '已注册工具',
      result_servers: '监测服务器',
      hint_auth: '检查 PAT 是否有效、是否过期。',
      hint_forbidden: '检查 PAT 的 scope 与 Nezha 服务器白名单。',
      hint_not_found: '确认地址以 /mcp 结尾，且 Dashboard 已开启 enable_mcp。',
      hint_timeout: '检查网络与反向代理超时，或调大请求超时。',
      hint_network: '检查地址、DNS、证书与反向代理。',
      hint_rate_limited: '稍后再试，或降低调用频率。',
      hint_servers: '服务器概览失败不影响工具使用，可能是 PAT 缺少 nezha:server:* scope。',
      hint_default: '请检查地址、PAT 和网络后重试。',
      unknownError: '操作失败，请重试。',
      loading: '正在读取配置…',
      loadingFailed: '设置服务尚未就绪，请重新打开插件详情页。',
      seconds: '{value} 秒',
    };

    const en = {
      routeTitle: 'Connection route',
      status_loading: 'Reading…',
      status_idle: 'Not configured',
      status_disabled: 'Disabled',
      status_connecting: 'Connecting…',
      status_connected: 'Connected',
      status_error: 'Connection failed',
      test: 'Test connection',
      settings: 'Connection settings',
      refreshTools: 'Refresh tools',
      refreshing: 'Refreshing…',
      retry: 'Reconnect',
      enable: 'Enable and connect',
      stripLabel: 'Connection chain: DeepSeek Harness, Nezha MCP, and tools',
      banner_idle_title: 'Nezha is not connected yet',
      banner_idle_body: 'Fill in the dashboard URL and an API token (PAT) to let the agent inspect servers, run commands, and read or write files.',
      banner_disabled_title: 'Plugin is disabled',
      banner_disabled_body: 'While disabled no mcp__nezha__* tools are registered and the agent cannot reach your servers.',
      banner_error_title: 'Connection failed',
      banner_token_readonly: 'A PAT is configured, but the DSH credential store is not writable.',
      savedNotice: 'Configuration saved; reconnecting now.',
      refreshedNotice: 'Reconnected and refreshed the Nezha tool list.',
      enabledNotice: 'Enabled; connecting to Nezha now.',
      configFile: 'Config file',
      copyPath: 'Copy path',
      copied: 'Copied',
      patStored: 'PAT in credential store',
      group_servers: 'Monitored servers',
      group_server: 'Server tools',
      group_fs: 'File tools',
      group_meta: 'Identity',
      group_other: 'Other tools',
      tools_count: '{count} tools',
      servers_summary: '{online}/{total} online',
      servers_none: 'Not connected',
      servers_empty: 'Nezha returned an empty server list.',
      servers_loading: 'Reading the server list…',
      servers_refresh: 'Refresh server status',
      servers_fetched: 'Updated {time}',
      tools_empty: 'Tools appear here after connecting',
      tools_hint: 'Tool names are mcp__nezha__* and map to the raw Nezha tool names.',
      server_last_active: 'Last active: {time}',
      tool_meta_whoami: 'Token identity',
      tool_server_list: 'List servers',
      tool_server_get: 'Server details',
      tool_server_exec: 'Run command',
      tool_fs_list: 'List directory',
      tool_fs_read: 'Read file',
      tool_fs_write: 'Write file',
      tool_fs_delete: 'Delete file',
      tool_fs_download_url: 'Download URL',
      tool_fs_upload_url: 'Upload URL',
      settingsTitle: 'Connection settings',
      urlLabel: 'Dashboard URL',
      urlHint: 'Enter the dashboard root or the full /mcp endpoint; /mcp is appended automatically.',
      urlPreview: 'Will connect to {endpoint}',
      urlEmptyHint: 'Leave blank to disconnect; the saved PAT is kept.',
      urlError_invalid: 'Enter a full URL starting with http:// or https://.',
      urlError_protocol: 'The URL must start with http:// or https://.',
      urlError_credentials: 'Remove the username or password from the URL; put the PAT in the token field.',
      tokenLabel: 'API token (PAT)',
      tokenSaved: 'Saved',
      tokenMissing: 'Not configured',
      tokenKeep: 'Saved; leave blank to keep it',
      tokenHint: 'Create an nzp_ token under Profile → API and grant only the scopes you need.',
      tokenShow: 'Show token',
      tokenHide: 'Hide token',
      timeoutLabel: 'Request timeout (seconds)',
      timeoutHint: '5–300 seconds; raise it for long-running commands.',
      timeoutError: 'The timeout must be a whole number between 5 and 300.',
      enabledLabel: 'Enable Nezha MCP',
      enabledHint: 'When off, no Nezha connection is made and no tools are registered.',
      clearToken: 'Remove the saved PAT',
      clearTokenHint: 'Applies on save; the plugin returns to the unconfigured state.',
      save: 'Save and connect',
      saving: 'Saving…',
      cancel: 'Cancel',
      close: 'Close',
      saveFailed: 'Saving failed; check the configuration and try again.',
      testTitle: 'Test connection',
      testIntro: 'Runs one MCP initialize and tools/list with the saved URL and PAT. Nothing is saved or changed.',
      testIntroDraft: 'The test uses the saved configuration; save a new URL in connection settings first.',
      testStart: 'Start test',
      testAgain: 'Test again',
      testDone: 'Test finished',
      testNoConfig: 'There is no configuration to test yet. Fill in the dashboard URL and PAT first.',
      testRunning: 'Testing…',
      testElapsed: '{value}s elapsed',
      step_address: 'Normalize URL',
      step_handshake: 'MCP handshake',
      step_tools: 'Read tool list',
      step_servers: 'Read server overview',
      step_pending: 'Pending',
      step_skipped: 'Skipped',
      step_running: 'Running…',
      step_failed: 'Failed',
      result_server: 'Server',
      result_protocol: 'Protocol',
      result_tools: 'Registered tools',
      result_servers: 'Monitored servers',
      hint_auth: 'Check that the PAT is valid and not expired.',
      hint_forbidden: 'Check the PAT scopes and the Nezha server allow list.',
      hint_not_found: 'Make sure the URL ends in /mcp and enable_mcp is on in Nezha.',
      hint_timeout: 'Check the network and reverse-proxy timeouts, or raise the request timeout.',
      hint_network: 'Check the URL, DNS, certificate, and reverse proxy.',
      hint_rate_limited: 'Retry later or lower the call frequency.',
      hint_servers: 'The server overview is optional; the PAT may lack the nezha:server:* scope.',
      hint_default: 'Check the URL, PAT, and network, then retry.',
      unknownError: 'The operation failed; please retry.',
      loading: 'Reading configuration…',
      loadingFailed: 'The settings service is not ready; reopen the plugin detail page.',
      seconds: '{value}s',
    };

    function createCodec(typeSymbol, jsonSchema) {
      const invalid = () => { throw new TypeError('Invalid Nezha settings payload.'); };
      const json = value => {
        if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
        if (typeof value === 'number' && Number.isFinite(value)) return;
        if (Array.isArray(value)) { for (const item of value) json(item); return; }
        if (value && typeof value === 'object') { for (const item of Object.values(value)) json(item); return; }
        invalid();
      };
      const validate = (value, schema) => {
        if (schema.anyOf) {
          for (const alternative of schema.anyOf) {
            try { validate(value, alternative); return; } catch {}
          }
          invalid();
        }
        const types = Array.isArray(schema.type) ? schema.type : [schema.type];
        const kind = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
        if (schema.type !== undefined && !types.includes(kind)) invalid();
        if (kind === 'number' && !Number.isFinite(value)) invalid();
        if (kind === 'object') {
          for (const required of schema.required ?? []) if (!Object.hasOwn(value, required)) invalid();
          for (const [key, item] of Object.entries(value)) {
            if (Object.hasOwn(schema.properties ?? {}, key)) validate(item, schema.properties[key]);
            else if (schema.additionalProperties === false) invalid();
            else json(item);
          }
        }
        if (kind === 'array') for (const item of value) validate(item, schema.items ?? {});
      };
      const parse = value => { validate(value, jsonSchema); return value; };
      return Object.freeze({
        mode: 'strict',
        typeSymbol,
        create: () => ({
          parse,
          safeParse(value) {
            try { return { success: true, data: parse(value) }; }
            catch (error) { return { success: false, error }; }
          },
        }),
        get jsonSchema() { return structuredClone(jsonSchema); },
      });
    }

    const objectSchema = { type: 'object', additionalProperties: true };
    const requestCodec = method => createCodec(`dsh-nezha/settings#${method}Request`, objectSchema);
    const resultCodec = method => createCodec(`dsh-nezha/settings#${method}Result`, objectSchema);
    const rawDescriptors = [
      {
        id: `dsh-nezha#${SERVICE}/snapshot`, service: SERVICE, namespace: SERVICE, method: 'snapshot',
        description: 'Read the Nezha MCP configuration, connection status, registered tools, and monitored servers.',
        invocation: { kind: 'direct' }, parameters: [],
        result: resultCodec('snapshot'),
      },
      {
        id: `dsh-nezha#${SERVICE}/save`, service: SERVICE, namespace: SERVICE, method: 'save',
        description: 'Save the Nezha endpoint, PAT, and enable state, then reconnect and refresh tools.',
        invocation: { kind: 'direct' },
        parameters: [{ name: 'request', wire: 'request', source: 'json', codec: requestCodec('save') }],
        result: resultCodec('save'),
      },
      {
        id: `dsh-nezha#${SERVICE}/test`, service: SERVICE, namespace: SERVICE, method: 'test',
        description: 'Test a Nezha MCP endpoint and PAT without saving, returning server info and tools.',
        invocation: { kind: 'direct' },
        parameters: [{ name: 'request', wire: 'request', source: 'json', codec: requestCodec('test') }],
        result: resultCodec('test'),
      },
      {
        id: `dsh-nezha#${SERVICE}/refresh`, service: SERVICE, namespace: SERVICE, method: 'refresh',
        description: 'Reconnect the saved Nezha MCP configuration and refresh the registered tools.',
        invocation: { kind: 'direct' }, parameters: [],
        result: resultCodec('refresh'),
      },
      {
        id: `dsh-nezha#${SERVICE}/servers`, service: SERVICE, namespace: SERVICE, method: 'servers',
        description: 'Refresh and return the monitored-server overview from the connected Nezha MCP server.',
        invocation: { kind: 'direct' }, parameters: [],
        result: resultCodec('servers'),
      },
    ];
    const descriptors = rawDescriptors.map(descriptor => ({
      ...descriptor,
      parameters: descriptor.parameters.map(parameter => ({
        ...parameter,
        codec: createCodec(parameter.codec.typeSymbol, parameter.codec.jsonSchema),
      })),
      result: createCodec(descriptor.result.typeSymbol, descriptor.result.jsonSchema),
    }));

    // ---------------------------------------------------------------------
    // Pure helpers (also exported for tests)
    // ---------------------------------------------------------------------

    const TOOL_GROUP_DEFS = [
      { id: 'server', labelKey: 'group_server', icon: 'server', prefix: 'server.' },
      { id: 'fs', labelKey: 'group_fs', icon: 'file', prefix: 'fs.' },
      { id: 'meta', labelKey: 'group_meta', icon: 'key', prefix: 'meta.' },
      { id: 'other', labelKey: 'group_other', icon: 'dots', prefix: '' },
    ];

    const TOOL_LABEL_KEYS = Object.freeze({
      'meta.whoami': 'tool_meta_whoami',
      'server.list': 'tool_server_list',
      'server.get': 'tool_server_get',
      'server.exec': 'tool_server_exec',
      'fs.list': 'tool_fs_list',
      'fs.read': 'tool_fs_read',
      'fs.write': 'tool_fs_write',
      'fs.delete': 'tool_fs_delete',
      'fs.download_url': 'tool_fs_download_url',
      'fs.upload_url': 'tool_fs_upload_url',
    });

    const ERROR_HINTS = Object.freeze({
      auth: 'hint_auth',
      forbidden: 'hint_forbidden',
      not_found: 'hint_not_found',
      timeout: 'hint_timeout',
      network: 'hint_network',
      rate_limited: 'hint_rate_limited',
      servers_unavailable: 'hint_servers',
    });

    function toolLabelKey(rawName) {
      return TOOL_LABEL_KEYS[String(rawName ?? '')] ?? '';
    }

    function toolLabel(t, rawName) {
      const key = toolLabelKey(rawName);
      return key === '' ? String(rawName ?? '') : t(key);
    }

    function toolGroupId(rawName) {
      const raw = String(rawName ?? '');
      for (const group of TOOL_GROUP_DEFS) {
        if (group.prefix !== '' && raw.startsWith(group.prefix)) return group.id;
      }
      return 'other';
    }

    /** Group discovered tools by their Nezha namespace, preserving group order. */
    function groupTools(tools) {
      const buckets = new Map(TOOL_GROUP_DEFS.map(group => [group.id, []]));
      for (const tool of Array.isArray(tools) ? tools : []) {
        if (!tool || typeof tool !== 'object') continue;
        const rawName = typeof tool.rawName === 'string' && tool.rawName !== '' ? tool.rawName : String(tool.name ?? '');
        const id = toolGroupId(rawName);
        buckets.get(id).push({ ...tool, rawName });
      }
      const groups = [];
      for (const definition of TOOL_GROUP_DEFS) {
        const items = buckets.get(definition.id);
        if (items.length === 0) continue;
        groups.push({
          id: definition.id,
          labelKey: definition.labelKey,
          icon: definition.icon,
          tools: items,
        });
      }
      return groups;
    }

    function statusTone(status) {
      if (status === 'connected') return 'ok';
      if (status === 'error') return 'error';
      if (status === 'connecting') return 'warn';
      return 'idle';
    }

    function summarizeServers(servers) {
      const list = Array.isArray(servers) ? servers : [];
      const online = list.filter(server => server && server.online === true).length;
      return { total: list.length, online, offline: list.length - online };
    }

    /**
     * Client-side preview of the endpoint the host would store. Mirrors
     * `normalizeEndpoint` in src/mcp.js so the form can validate before saving.
     */
    function endpointPreview(raw) {
      if (typeof raw !== 'string' || raw.trim() === '') return { ok: false, code: 'empty' };
      let parsed;
      try {
        parsed = new URL(raw.trim());
      } catch {
        return { ok: false, code: 'invalid' };
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { ok: false, code: 'protocol' };
      if (parsed.username || parsed.password) return { ok: false, code: 'credentials' };
      parsed.hash = '';
      parsed.search = '';
      let path = parsed.pathname.replace(/\/+$/, '');
      if (!path.endsWith('/mcp')) path = `${path}/mcp`;
      parsed.pathname = path;
      return { ok: true, endpoint: parsed.href.replace(/\/$/, '') };
    }

    function errorHintKey(code) {
      return ERROR_HINTS[String(code ?? '')] ?? 'hint_default';
    }

    function formatClock(value, options) {
      if (typeof value !== 'string' || value === '') return '';
      try {
        return new Date(value).toLocaleTimeString(options?.locale, { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    }

    function errorMessage(error, t) {
      if (error && typeof error.message === 'string' && error.message !== '') return error.message;
      return t('unknownError');
    }

    // ---------------------------------------------------------------------
    // Styles: scoped to .dsh-nezha, built only from DSH design tokens
    // ---------------------------------------------------------------------

    const CSS = `
      .dsh-nezha {
        --nz-line: var(--dsw-alias-border-l1);
        --nz-line-2: var(--dsw-alias-border-l2);
        --nz-panel: var(--dsw-alias-bg-layer-1);
        --nz-panel-2: var(--dsw-alias-bg-layer-2);
        --nz-text: var(--dsw-alias-label-primary);
        --nz-text-2: var(--dsw-alias-label-secondary);
        --nz-text-3: var(--dsw-alias-label-tertiary);
        --nz-brand: var(--dsw-alias-brand-primary);
        --nz-ok: var(--dsw-alias-state-success-primary);
        --nz-warn: var(--dsw-alias-state-warn-primary);
        --nz-err: var(--dsw-alias-state-error-primary);
        --nz-ok-soft: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);
        --nz-warn-soft: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, transparent);
        --nz-err-soft: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent);
        --nz-brand-soft: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);
        --nz-edge: color-mix(in srgb, var(--dsw-alias-border-l2) 90%, transparent);
        --nz-edge-strong: color-mix(in srgb, var(--dsw-alias-brand-primary) 52%, var(--dsw-alias-border-l2));
        --nz-dot: color-mix(in srgb, var(--dsw-alias-border-l2) 76%, transparent);
        --nz-shadow: 0 1px 2px color-mix(in srgb, #000 5%, transparent), 0 10px 26px color-mix(in srgb, #000 4%, transparent);
        --nz-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", monospace;
        display: flex; flex-direction: column; gap: 12px;
        color: var(--nz-text); font-size: 13px; line-height: 1.5; padding: 2px 0 8px; min-width: 0;
      }
      .dsh-nezha * { box-sizing: border-box; }
      .dsh-nezha button { font: inherit; color: inherit; }
      .dsh-nezha :is(button, a, input, [tabindex]):focus-visible { outline: 2px solid var(--nz-brand); outline-offset: 1px; }
      .dsh-nezha .nz-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

      .dsh-nezha .nz-route { display: flex; flex-direction: column; border: 1px solid var(--nz-line); border-radius: var(--dsw-radius-xl, 14px); background: var(--nz-panel); box-shadow: var(--nz-shadow); overflow: hidden; }
      .dsh-nezha .nz-head { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; padding: 12px 14px; }
      .dsh-nezha .nz-title { display: inline-flex; align-items: center; gap: 8px; margin: 0; font-size: 15px; font-weight: 650; letter-spacing: -.1px; }
      .dsh-nezha .nz-head-actions { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-left: auto; }
      .dsh-nezha .nz-strip { display: inline-flex; align-items: center; gap: 1px; padding: 3px 4px; border: 1px solid var(--nz-line); border-radius: 8px; background: var(--nz-panel-2); color: var(--nz-text-3); }
      .dsh-nezha .nz-strip-tile { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 5px; }
      .dsh-nezha .nz-strip-arrow { display: grid; place-items: center; width: 10px; height: 10px; opacity: .55; }

      .dsh-nezha .nz-pill { display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px; border: 1px solid var(--nz-line); border-radius: 999px; background: var(--nz-panel-2); color: var(--nz-text-2); font-size: 12px; font-weight: 500; white-space: nowrap; }
      .dsh-nezha .nz-pill[data-tone=ok] { color: var(--nz-ok); border-color: color-mix(in srgb, var(--nz-ok) 42%, transparent); background: var(--nz-ok-soft); }
      .dsh-nezha .nz-pill[data-tone=warn] { color: var(--nz-warn); border-color: color-mix(in srgb, var(--nz-warn) 42%, transparent); background: var(--nz-warn-soft); }
      .dsh-nezha .nz-pill[data-tone=error] { color: var(--nz-err); border-color: color-mix(in srgb, var(--nz-err) 42%, transparent); background: var(--nz-err-soft); }
      .dsh-nezha .nz-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex: none; }
      .dsh-nezha .nz-pill[data-tone=warn] .nz-dot { animation: nz-pulse 1.25s ease-in-out infinite; }

      .dsh-nezha .nz-banner { display: flex; align-items: flex-start; gap: 9px; margin: 0 14px 12px; padding: 9px 11px; border: 1px solid var(--nz-line); border-radius: var(--dsw-radius-lg, 10px); background: var(--nz-panel-2); }
      .dsh-nezha .nz-banner[data-tone=ok] { border-color: color-mix(in srgb, var(--nz-ok) 36%, transparent); background: var(--nz-ok-soft); }
      .dsh-nezha .nz-banner[data-tone=warn] { border-color: color-mix(in srgb, var(--nz-warn) 36%, transparent); background: var(--nz-warn-soft); }
      .dsh-nezha .nz-banner[data-tone=error] { border-color: color-mix(in srgb, var(--nz-err) 36%, transparent); background: var(--nz-err-soft); }
      .dsh-nezha .nz-banner-icon { flex: none; margin-top: 2px; color: var(--nz-text-2); }
      .dsh-nezha .nz-banner[data-tone=ok] .nz-banner-icon { color: var(--nz-ok); }
      .dsh-nezha .nz-banner[data-tone=warn] .nz-banner-icon { color: var(--nz-warn); }
      .dsh-nezha .nz-banner[data-tone=error] .nz-banner-icon { color: var(--nz-err); }
      .dsh-nezha .nz-banner-main { flex: 1; min-width: 0; }
      .dsh-nezha .nz-banner-title { font-size: 13px; font-weight: 600; }
      .dsh-nezha .nz-banner-body { margin-top: 2px; color: var(--nz-text-2); font-size: 12.5px; overflow-wrap: anywhere; }
      .dsh-nezha .nz-banner-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }

      .dsh-nezha .nz-stage { position: relative; display: flex; align-items: center; gap: 0; padding: 22px 18px; border-top: 1px solid var(--nz-line); border-bottom: 1px solid var(--nz-line); background-color: color-mix(in srgb, var(--nz-panel-2) 58%, transparent); background-image: radial-gradient(var(--nz-dot) 1px, transparent 1px); background-size: 16px 16px; background-position: center; }
      .dsh-nezha .nz-col { min-width: 0; }
      .dsh-nezha .nz-col-host { flex: 0 1 168px; }
      .dsh-nezha .nz-col-hub { flex: 0 1 196px; }
      .dsh-nezha .nz-col-groups { flex: 1 1 250px; min-width: 0; }
      .dsh-nezha .nz-wire { position: relative; flex: 0 0 32px; height: 16px; align-self: center; }
      .dsh-nezha .nz-wire::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1.5px; transform: translateY(-50%); background: var(--nz-edge); }
      .dsh-nezha .nz-wire::after { content: ""; position: absolute; right: 0; top: 50%; width: 5px; height: 5px; border-radius: 50%; transform: translateY(-50%); background: var(--nz-edge); }
      .dsh-nezha .nz-stage[data-state=connected] .nz-wire::before { background: linear-gradient(90deg, var(--nz-edge), var(--nz-edge-strong)); }
      .dsh-nezha .nz-stage[data-state=connected] .nz-wire::after { background: var(--nz-brand); }
      .dsh-nezha .nz-wire-hub { flex-basis: 26px; }

      .dsh-nezha .nz-node { display: flex; flex-direction: column; gap: 3px; width: 100%; padding: 11px 12px; border: 1px solid var(--nz-line-2); border-radius: var(--dsw-radius-lg, 10px); background: var(--nz-panel); color: var(--nz-text); text-align: left; box-shadow: var(--nz-shadow); }
      .dsh-nezha .nz-node-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .dsh-nezha .nz-node-logo { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; flex: none; background: var(--nz-brand-soft); color: var(--nz-brand); }
      .dsh-nezha .nz-node-name { font-size: 12.5px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-nezha .nz-node-meta { color: var(--nz-text-2); font-size: 11.5px; overflow-wrap: anywhere; }
      .dsh-nezha .nz-node-hub { position: relative; cursor: pointer; transition: border-color .15s ease, background-color .15s ease; }
      .dsh-nezha button.nz-node-hub:hover { border-color: var(--nz-edge-strong); background: color-mix(in srgb, var(--nz-brand) 4%, var(--nz-panel)); }
      .dsh-nezha .nz-hub-pill { display: inline-flex; align-items: center; gap: 4px; align-self: flex-start; margin-top: 2px; padding: 1px 8px; border: 1px solid var(--nz-line); border-radius: 999px; color: var(--nz-text-2); font-size: 11px; background: var(--nz-panel-2); }
      .dsh-nezha .nz-node-hub:hover .nz-hub-pill { color: var(--nz-brand); border-color: color-mix(in srgb, var(--nz-brand) 40%, transparent); }

      .dsh-nezha .nz-groups { position: relative; display: flex; flex-direction: column; gap: 7px; padding-left: 20px; }
      .dsh-nezha .nz-groups::before { content: ""; position: absolute; left: 2px; top: 16px; bottom: 16px; width: 1.5px; border-radius: 2px; background: var(--nz-edge); }
      .dsh-nezha .nz-stage[data-state=connected] .nz-groups::before { background: color-mix(in srgb, var(--nz-edge-strong) 82%, transparent); }
      .dsh-nezha .nz-group { position: relative; border: 1px solid var(--nz-line); border-radius: var(--dsw-radius-lg, 10px); background: var(--nz-panel); box-shadow: var(--nz-shadow); overflow: hidden; }
      .dsh-nezha .nz-group::before { content: ""; position: absolute; left: -18px; top: 19px; width: 18px; height: 1.5px; background: var(--nz-edge); }
      .dsh-nezha .nz-stage[data-state=connected] .nz-group::before { background: var(--nz-edge-strong); }
      .dsh-nezha .nz-group-head { display: flex; align-items: center; gap: 7px; flex: 1 1 auto; min-width: 0; padding: 8px 10px; border: 0; background: none; color: var(--nz-text); text-align: left; cursor: pointer; }
      .dsh-nezha .nz-group-head:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .dsh-nezha .nz-group-icon { display: grid; place-items: center; flex: none; color: var(--nz-brand); }
      .dsh-nezha .nz-group-label { font-size: 12.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-nezha .nz-group-meta { margin-left: auto; color: var(--nz-text-3); font-size: 11.5px; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .dsh-nezha .nz-group-chevron { flex: none; color: var(--nz-text-3); transition: transform .16s ease; }
      .dsh-nezha .nz-group[data-open=true] .nz-group-chevron { transform: rotate(90deg); }
      .dsh-nezha .nz-group-action { display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--nz-text-3); cursor: pointer; flex: none; }
      .dsh-nezha .nz-group-action:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--nz-text); }
      .dsh-nezha .nz-group-body { border-top: 1px solid var(--nz-line); }
      .dsh-nezha .nz-group-note { padding: 9px 11px; color: var(--nz-text-3); font-size: 11.5px; }

      .dsh-nezha .nz-list { display: flex; flex-direction: column; max-height: 252px; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; }
      .dsh-nezha .nz-server { display: flex; align-items: center; gap: 8px; padding: 6px 11px; font-size: 12px; }
      .dsh-nezha .nz-server + .nz-server { border-top: 1px solid color-mix(in srgb, var(--nz-line) 65%, transparent); }
      .dsh-nezha .nz-server-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--nz-text-3); flex: none; }
      .dsh-nezha .nz-server[data-online=true] .nz-server-dot { background: var(--nz-ok); box-shadow: 0 0 0 3px var(--nz-ok-soft); }
      .dsh-nezha .nz-server-name { font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-nezha .nz-server-meta { margin-left: auto; max-width: 54%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--nz-text-3); font: 10.5px/1.6 var(--nz-mono); }
      .dsh-nezha .nz-tool { display: flex; align-items: baseline; gap: 8px; min-width: 0; padding: 6px 11px; }
      .dsh-nezha .nz-tool + .nz-tool { border-top: 1px solid color-mix(in srgb, var(--nz-line) 65%, transparent); }
      .dsh-nezha .nz-tool-title { flex: none; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
      .dsh-nezha .nz-tool-code { min-width: 0; margin-left: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--nz-text-3); font: 10.5px/1.6 var(--nz-mono); }
      .dsh-nezha .nz-empty { padding: 10px 11px; color: var(--nz-text-3); font-size: 11.5px; }

      .dsh-nezha .nz-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; padding: 8px 13px; background: var(--nz-panel-2); color: var(--nz-text-2); font-size: 11.5px; }
      .dsh-nezha .nz-foot-label { color: var(--nz-text-3); }
      .dsh-nezha .nz-foot-path { max-width: min(52%, 300px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 1px 7px; border: 1px solid var(--nz-line); border-radius: 6px; background: var(--nz-panel); color: var(--nz-text-2); font: 10.5px/1.7 var(--nz-mono); }
      .dsh-nezha .nz-foot-tag { padding: 1px 7px; border-radius: 999px; border: 1px solid var(--nz-line); color: var(--nz-text-3); font-size: 11px; }
      .dsh-nezha .nz-spacer { margin-left: auto; }

      .dsh-nezha .nz-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border: 1px solid var(--nz-line-2); border-radius: var(--dsw-radius-md, 8px); background: var(--nz-panel); color: var(--nz-text); font-size: 12.5px; line-height: 1.35; white-space: nowrap; cursor: pointer; transition: background-color .12s ease, border-color .12s ease; }
      .dsh-nezha .nz-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
      .dsh-nezha .nz-btn:disabled { opacity: .55; cursor: not-allowed; }
      .dsh-nezha .nz-btn-primary { border-color: transparent; background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); font-weight: 600; }
      .dsh-nezha .nz-btn-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
      .dsh-nezha .nz-btn-ghost { border-color: transparent; background: transparent; color: var(--nz-text-2); }
      .dsh-nezha .nz-btn-ghost:hover:not(:disabled) { color: var(--nz-text); background: var(--dsw-alias-interactive-bg-hover); }
      .dsh-nezha .nz-btn-danger { border-color: color-mix(in srgb, var(--nz-err) 40%, transparent); background: transparent; color: var(--nz-err); }
      .dsh-nezha .nz-btn-danger:hover:not(:disabled) { background: var(--nz-err-soft); }
      .dsh-nezha .nz-btn-sm { padding: 4px 9px; font-size: 11.5px; }
      .dsh-nezha .nz-icon-btn { display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--nz-text-3); cursor: pointer; flex: none; }
      .dsh-nezha .nz-icon-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--nz-text); }
      .dsh-nezha .nz-icon-btn:disabled { opacity: .5; cursor: not-allowed; }

      .dsh-nezha .nz-loading { display: flex; align-items: center; gap: 8px; padding: 16px 2px; color: var(--nz-text-2); font-size: 13px; }

      .dsh-nezha .nz-overlay { position: fixed; inset: 0; z-index: ${OVERLAY_Z_INDEX}; display: flex; align-items: flex-start; justify-content: center; padding: 84px 18px 24px; overflow: auto; background: color-mix(in srgb, #000 34%, transparent); }
      .dsh-nezha .nz-dialog { display: flex; flex-direction: column; width: min(540px, 100%); max-height: calc(100vh - 120px); border: 1px solid var(--nz-line-2); border-radius: var(--dsw-radius-xl, 14px); background: var(--nz-panel); box-shadow: 0 24px 64px color-mix(in srgb, #000 30%, transparent); }
      .dsh-nezha .nz-dialog-wide { width: min(600px, 100%); }
      .dsh-nezha .nz-dialog-head { display: flex; align-items: center; gap: 8px; padding: 14px 16px 10px; }
      .dsh-nezha .nz-dialog-title { margin: 0; font-size: 15px; font-weight: 650; }
      .dsh-nezha .nz-dialog-close { margin-left: auto; }
      .dsh-nezha .nz-dialog-body { padding: 4px 16px 16px; overflow: auto; }
      .dsh-nezha .nz-dialog-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--nz-line); }

      .dsh-nezha .nz-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
      .dsh-nezha .nz-label { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; }
      .dsh-nezha .nz-input { width: 100%; min-height: 34px; padding: 7px 10px; border: 1px solid var(--nz-line-2); border-radius: var(--dsw-radius-md, 8px); background: var(--dsw-alias-bg-base); color: var(--nz-text); font-family: inherit; font-size: 13px; line-height: 1.4; }
      .dsh-nezha .nz-input:focus-visible { outline: 2px solid var(--nz-brand); outline-offset: 1px; border-color: var(--nz-brand); }
      .dsh-nezha .nz-input:disabled { opacity: .6; }
      .dsh-nezha .nz-input-wrap { position: relative; display: flex; align-items: center; }
      .dsh-nezha .nz-input-wrap .nz-input { padding-right: 38px; }
      .dsh-nezha .nz-input-action { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); }
      .dsh-nezha .nz-hint { margin: 0; color: var(--nz-text-3); font-size: 11.5px; line-height: 1.55; }
      .dsh-nezha .nz-form-error { margin: 0; color: var(--nz-err); font-size: 12px; }
      .dsh-nezha .nz-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .dsh-nezha .nz-form-grid .nz-span-2 { grid-column: 1 / -1; }
      .dsh-nezha .nz-badge { padding: 1px 7px; border: 1px solid var(--nz-line); border-radius: 999px; color: var(--nz-text-3); font-size: 10.5px; font-weight: 400; }
      .dsh-nezha .nz-badge[data-tone=ok] { color: var(--nz-ok); border-color: color-mix(in srgb, var(--nz-ok) 42%, transparent); }
      .dsh-nezha .nz-badge[data-tone=warn] { color: var(--nz-warn); border-color: color-mix(in srgb, var(--nz-warn) 42%, transparent); }
      .dsh-nezha .nz-check-row { display: flex; align-items: flex-start; gap: 8px; }
      .dsh-nezha .nz-check-row input { margin: 2px 0 0; accent-color: var(--nz-brand); inline-size: 14px; block-size: 14px; flex: none; }
      .dsh-nezha .nz-check-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

      .dsh-nezha .nz-switch { position: relative; display: inline-flex; align-items: center; gap: 9px; cursor: pointer; font-size: 12.5px; user-select: none; }
      .dsh-nezha .nz-switch input { position: absolute; left: 0; top: 50%; width: 38px; height: 22px; margin: 0; transform: translateY(-50%); opacity: 0; cursor: pointer; z-index: 1; }
      .dsh-nezha .nz-switch-track { position: relative; width: 38px; height: 22px; border-radius: 999px; background: var(--dsw-alias-border-l2); transition: background-color .15s ease; flex: none; }
      .dsh-nezha .nz-switch-knob { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-switch-thumb, #fff); box-shadow: 0 1px 2px color-mix(in srgb, #000 20%, transparent); transition: transform .15s ease; }
      .dsh-nezha .nz-switch input:checked + .nz-switch-track { background: var(--nz-brand); }
      .dsh-nezha .nz-switch input:checked + .nz-switch-track .nz-switch-knob { transform: translateX(16px); }
      .dsh-nezha .nz-switch input:focus-visible + .nz-switch-track { outline: 2px solid var(--nz-brand); outline-offset: 2px; }
      .dsh-nezha .nz-switch input:disabled + .nz-switch-track { opacity: .55; }
      .dsh-nezha .nz-switch input:disabled ~ * { cursor: not-allowed; }

      .dsh-nezha .nz-steps { display: flex; flex-direction: column; margin: 10px 0 0; }
      .dsh-nezha .nz-step { display: flex; align-items: flex-start; gap: 9px; padding: 7px 0; }
      .dsh-nezha .nz-step + .nz-step { border-top: 1px dashed var(--nz-line); }
      .dsh-nezha .nz-step-icon { display: grid; place-items: center; flex: none; width: 17px; height: 17px; margin-top: 1px; color: var(--nz-text-3); }
      .dsh-nezha .nz-step[data-tone=ok] .nz-step-icon { color: var(--nz-ok); }
      .dsh-nezha .nz-step[data-tone=error] .nz-step-icon { color: var(--nz-err); }
      .dsh-nezha .nz-step[data-tone=run] .nz-step-icon { color: var(--nz-brand); }
      .dsh-nezha .nz-step-main { flex: 1; min-width: 0; }
      .dsh-nezha .nz-step-title { font-size: 12.5px; font-weight: 600; }
      .dsh-nezha .nz-step-detail { margin-top: 1px; color: var(--nz-text-2); font-size: 11.5px; overflow-wrap: anywhere; }
      .dsh-nezha .nz-spinner { width: 14px; height: 14px; border: 2px solid color-mix(in srgb, var(--nz-brand) 24%, transparent); border-top-color: var(--nz-brand); border-radius: 50%; animation: nz-spin .8s linear infinite; }
      .dsh-nezha .nz-result { margin-top: 11px; padding: 10px 12px; border: 1px solid var(--nz-line); border-radius: var(--dsw-radius-lg, 10px); background: var(--nz-panel-2); }
      .dsh-nezha .nz-result[data-tone=ok] { border-color: color-mix(in srgb, var(--nz-ok) 40%, transparent); background: var(--nz-ok-soft); }
      .dsh-nezha .nz-result[data-tone=error] { border-color: color-mix(in srgb, var(--nz-err) 40%, transparent); background: var(--nz-err-soft); }
      .dsh-nezha .nz-result-title { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 12.5px; font-weight: 600; }
      .dsh-nezha .nz-result[data-tone=ok] .nz-result-title { color: var(--nz-ok); }
      .dsh-nezha .nz-result[data-tone=error] .nz-result-title { color: var(--nz-err); }
      .dsh-nezha .nz-kv { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 3px 12px; margin: 0; font-size: 12px; }
      .dsh-nezha .nz-kv dt { color: var(--nz-text-3); }
      .dsh-nezha .nz-kv dd { margin: 0; overflow-wrap: anywhere; }
      .dsh-nezha .nz-result-note { margin: 8px 0 0; color: var(--nz-text-2); font-size: 11.5px; overflow-wrap: anywhere; }
      .dsh-nezha .nz-elapsed { color: var(--nz-text-3); font-size: 11.5px; font-variant-numeric: tabular-nums; }

      .dsh-nezha .nz-toast { position: fixed; right: 20px; bottom: 20px; z-index: ${OVERLAY_Z_INDEX}; padding: 8px 12px; border: 1px solid var(--nz-line-2); border-radius: 9px; background: var(--nz-panel); color: var(--nz-text); box-shadow: 0 10px 30px color-mix(in srgb, #000 22%, transparent); font-size: 12.5px; }

      .dsh-nezha-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; color: var(--dsw-alias-label-secondary); text-decoration: none; vertical-align: middle; }
      .dsh-nezha-badge:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover); }
      .dsh-nezha-badge:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }

      @keyframes nz-spin { to { transform: rotate(360deg); } }
      @keyframes nz-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

      @media (max-width: 860px) {
        .dsh-nezha .nz-stage { flex-direction: column; align-items: stretch; gap: 12px; padding: 16px; }
        .dsh-nezha .nz-wire { display: none; }
        .dsh-nezha .nz-col-host, .dsh-nezha .nz-col-hub { flex: none; max-width: none; }
        .dsh-nezha .nz-col-hub { max-width: 260px; }
        .dsh-nezha .nz-col-groups { padding-top: 2px; }
        .dsh-nezha .nz-groups { padding-left: 0; }
        .dsh-nezha .nz-groups::before, .dsh-nezha .nz-group::before { display: none; }
        .dsh-nezha .nz-form-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 520px) {
        .dsh-nezha .nz-head { padding: 10px 11px; }
        .dsh-nezha .nz-strip { display: none; }
        .dsh-nezha .nz-foot-path { max-width: 100%; }
        .dsh-nezha .nz-dialog-foot .nz-spacer { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dsh-nezha *, .dsh-nezha *::before, .dsh-nezha *::after { animation: none !important; transition: none !important; }
      }
    `;

    async function invoke(remote, method, request) {
      const namespace = remote?.nezhaSettings;
      if (!namespace || typeof namespace[method] !== 'function') {
        throw new Error('Nezha 设置服务尚未加载，请重新打开插件详情页。');
      }
      let result;
      try {
        result = request === undefined ? await namespace[method]() : await namespace[method](request);
      } catch {
        throw new Error('设置连接不可用，请重新打开插件详情页。');
      }
      if (result && result.ok === true) return result.value;
      const error = new Error(result?.error?.message || '设置操作失败，请重试。');
      error.code = result?.error?.code;
      throw error;
    }

    // ---------------------------------------------------------------------
    // Icons
    // ---------------------------------------------------------------------

    const ICON_PATHS = {
      chevron: h('path', { d: 'M6 4l4 4-4 4' }),
      close: h('path', { d: 'M4 4l8 8M12 4l-8 8' }),
      check: h('path', { d: 'M3 8.5l3.2 3.2L13 5' }),
      alert: h('path', { d: 'M8 3l6 11H2zM8 7v3.4M8 12.1v.4' }),
      info: h('path', { d: 'M8 7.4v4.2M8 5.1v.2' }),
      copy: h('path', { d: 'M5.5 5.5V3.4A1.4 1.4 0 016.9 2h4.2A1.4 1.4 0 0112.5 3.4v4.2a1.4 1.4 0 01-1.4 1.4H9.5M3.5 7.5V12a2 2 0 002 2h4a2 2 0 002-2V8a2 2 0 00-2-2H5.5a2 2 0 00-2 2z' }),
      refresh: h('path', { d: 'M13 3v3.2H9.8M3 13V9.8h3.2M3.4 6.2A5 5 0 0113 6.2M12.6 9.8A5 5 0 013 9.8' }),
      play: h('path', { d: 'M4.5 3.2l8 4.8-8 4.8z' }),
      eye: h('g', null, [h('path', { key: 'a', d: 'M1.6 8S4 3.6 8 3.6 14.4 8 14.4 8 12 12.4 8 12.4 1.6 8 1.6 8z' }), h('circle', { key: 'b', cx: '8', cy: '8', r: '2' })]),
      eyeOff: h('g', null, h('path', { key: 'a', d: 'M2 2l12 12M6.4 6.5A2 2 0 008 10a2 2 0 001.6-.8M1.6 8S4 3.6 8 3.6c1.2 0 2.2.4 3.1 1M14.4 8s-1 1.9-2.9 3.1' })),
      github: h('path', { d: 'M8 .8a7.2 7.2 0 00-2.3 14c.4.1.5-.2.5-.4v-1.3c-2 .5-2.4-1-2.4-1-.3-.8-.8-1-.8-1-.7-.4 0-.4 0-.4.7 0 1.1.7 1.1.7.7 1.1 1.7.8 2.1.6 0-.5.3-.8.5-1-1.6-.2-3.3-.8-3.3-3.5 0-.8.3-1.5.7-2-.1-.2-.3-.9.1-1.9 0 0 .6-.2 2 .7a7 7 0 013.7 0c1.4-.9 2-.7 2-.7.4 1 .2 1.7.1 1.9.5.5.7 1.2.7 2 0 2.7-1.7 3.3-3.3 3.5.3.2.5.7.5 1.5v2.2c0 .2.1.5.5.4A7.2 7.2 0 008 .8z' }),
      server: h('g', null, [h('rect', { key: 'a', x: '2', y: '2.6', width: '12', height: '4.4', rx: '1.2' }), h('rect', { key: 'b', x: '2', y: '9', width: '12', height: '4.4', rx: '1.2' }), h('path', { key: 'c', d: 'M4.6 4.8h.01M4.6 11.2h.01M7 4.8h4M7 11.2h4' })]),
      file: h('path', { d: 'M4 1.8h5l3.2 3.2V14H4zM9 1.8V5h3.2M6 8.4h4M6 10.8h4' }),
      key: h('path', { d: 'M9.8 2.4a3.8 3.8 0 00-3.5 5.3L1.6 12.4v2h2l.7-.7v-1.3h1.3l.9-.9V10h1.3l1-1a3.8 3.8 0 001-6.6M11 5.2h.01' }),
      dots: h('g', null, [h('circle', { key: 'a', cx: '3', cy: '8', r: '1.1' }), h('circle', { key: 'b', cx: '8', cy: '8', r: '1.1' }), h('circle', { key: 'c', cx: '13', cy: '8', r: '1.1' })]),
      arrowRight: h('path', { d: 'M2.5 8h11M9.5 4l4 4-4 4' }),
      host: h('g', null, [h('rect', { key: 'a', x: '2', y: '3', width: '12', height: '9', rx: '2' }), h('path', { key: 'b', d: 'M5 14.5h6M6 6.4h4M6 8.8h2.6' })]),
    };

    function Icon({ name, size = 15, strokeWidth = 1.6 }) {
      const body = ICON_PATHS[name];
      if (!body) return null;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor',
        strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
        focusable: 'false', style: { display: 'block', flex: 'none' },
      }, body);
    }

    function NezhaMark({ size = 30 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': 'true', focusable: 'false',
        style: { display: 'block', borderRadius: Math.round(size * 0.28) },
      }, [
        h('defs', { key: 'defs' }, h('linearGradient', { id: 'dsh-nezha-mark', x1: '8', y1: '6', x2: '56', y2: '58', gradientUnits: 'userSpaceOnUse' }, [
          h('stop', { key: 'a', offset: '0', stopColor: '#2f7cf6' }),
          h('stop', { key: 'b', offset: '1', stopColor: '#12a6a0' }),
        ])),
        h('rect', { key: 'bg', x: '4', y: '4', width: '56', height: '56', rx: '14', fill: 'url(#dsh-nezha-mark)' }),
        h('g', { key: 'glyph', fill: 'none', stroke: '#fff', strokeLinecap: 'round', strokeLinejoin: 'round' }, [
          h('rect', { key: 'r1', x: '17', y: '20', width: '30', height: '10', rx: '3', strokeWidth: '3.2' }),
          h('rect', { key: 'r2', x: '17', y: '35', width: '30', height: '10', rx: '3', strokeWidth: '3.2' }),
          h('path', { key: 'd1', d: 'M23 25h.01M23 40h.01', strokeWidth: '4' }),
          h('path', { key: 'd2', d: 'M30 25h11M30 40h11', strokeWidth: '2.6', opacity: '.85' }),
          h('path', { key: 'd3', d: 'M47 30c3.2 2 3.2 6 0 8', strokeWidth: '2.4', opacity: '.9' }),
        ]),
      ]);
    }

    // ---------------------------------------------------------------------
    // Small presentational pieces
    // ---------------------------------------------------------------------

    function StatusPill({ status, t }) {
      const label = t(`status_${status}`);
      return h('span', { className: 'nz-pill', 'data-tone': statusTone(status), role: 'status', 'aria-live': 'polite' }, [
        h('span', { key: 'dot', className: 'nz-dot', 'aria-hidden': 'true' }),
        h('span', { key: 'label' }, label),
      ]);
    }

    function Strip({ connected }) {
      return h('span', { className: 'nz-strip', 'aria-label': 'connection chain' }, [
        h('span', { key: 'host', className: 'nz-strip-tile', title: 'DeepSeek Harness' }, h(Icon, { name: 'host', size: 13 })),
        h('span', { key: 'a1', className: 'nz-strip-arrow' }, h(Icon, { name: 'chevron', size: 9 })),
        h('span', { key: 'nezha', className: 'nz-strip-tile', title: 'Nezha MCP' }, NezhaMark({ size: 16 })),
        h('span', { key: 'a2', className: 'nz-strip-arrow' }, h(Icon, { name: 'chevron', size: 9 })),
        h('span', { key: 'tools', className: 'nz-strip-tile', title: 'Tools' }, h(Icon, { name: connected ? 'server' : 'dots', size: 13 })),
      ]);
    }

    function Banner({ tone, icon, title, body, actions, onDismiss, t }) {
      return h('div', { className: 'nz-banner', 'data-tone': tone, role: tone === 'error' ? 'alert' : 'status' }, [
        h('span', { key: 'icon', className: 'nz-banner-icon' }, h(Icon, { name: icon, size: 15 })),
        h('div', { key: 'main', className: 'nz-banner-main' }, [
          title ? h('div', { key: 'title', className: 'nz-banner-title' }, title) : null,
          body ? h('div', { key: 'body', className: 'nz-banner-body' }, body) : null,
          actions && actions.length > 0
            ? h('div', { key: 'actions', className: 'nz-banner-actions' }, actions)
            : null,
        ]),
        onDismiss
          ? h('button', {
            key: 'dismiss', type: 'button', className: 'nz-icon-btn', title: t('close'),
            onClick: onDismiss, 'aria-label': t('close'),
          }, h(Icon, { name: 'close', size: 13 }))
          : null,
      ]);
    }

    function SwitchField({ checked, disabled, onChange, label, hint }) {
      return h('label', { className: 'nz-field' }, [
        h('span', { key: 'row', className: 'nz-switch' }, [
          h('input', {
            key: 'input', type: 'checkbox', role: 'switch', checked, disabled,
            'aria-checked': checked,
            onChange: event => onChange(event.target.checked),
          }),
          h('span', { key: 'track', className: 'nz-switch-track', 'aria-hidden': 'true' },
            h('span', { className: 'nz-switch-knob' })),
          h('span', { key: 'text' }, label),
        ]),
        hint ? h('span', { key: 'hint', className: 'nz-hint' }, hint) : null,
      ]);
    }

    function GroupSection({ id, icon, label, meta, open, onToggle, action, children }) {
      return h('div', { className: 'nz-group', 'data-open': open ? 'true' : 'false' }, [
        h('div', { key: 'head-wrap', style: { display: 'flex', alignItems: 'center' } }, [
          h('button', {
            key: 'head', type: 'button', className: 'nz-group-head',
            'aria-expanded': open, onClick: onToggle,
          }, [
            h('span', { key: 'icon', className: 'nz-group-icon' }, h(Icon, { name: icon, size: 14 })),
            h('span', { key: 'label', className: 'nz-group-label' }, label),
            h('span', { key: 'meta', className: 'nz-group-meta' }, meta),
            h('span', { key: 'chev', className: 'nz-group-chevron' }, h(Icon, { name: 'chevron', size: 13 })),
          ]),
          action ?? null,
        ]),
        open ? h('div', { key: 'body', className: 'nz-group-body' }, children) : null,
      ]);
    }

    function ServerRows({ servers, t }) {
      if (!Array.isArray(servers) || servers.length === 0) {
        return h('div', { className: 'nz-empty' }, t('servers_empty'));
      }
      const ordered = [...servers].sort((a, b) => Number(b.online) - Number(a.online));
      return h('div', { className: 'nz-list', role: 'list' }, ordered.map((server, index) => h('div', {
        key: `${server.id}-${server.name}-${index}`,
        className: 'nz-server',
        'data-online': server.online ? 'true' : 'false',
        role: 'listitem',
        title: server.lastActive ? t('server_last_active', { time: server.lastActive }) : undefined,
      }, [
        h('span', { key: 'dot', className: 'nz-server-dot', 'aria-hidden': 'true' }),
        h('span', { key: 'name', className: 'nz-server-name' }, server.name),
        h('span', { key: 'meta', className: 'nz-server-meta' },
          [server.platform, server.ipv4].filter(Boolean).join(' · ') || (server.online ? '' : '—')),
      ])));
    }

    function ToolRows({ tools, t }) {
      return h('div', { className: 'nz-list', role: 'list' }, tools.map(tool => h('div', {
        key: tool.name,
        className: 'nz-tool',
        role: 'listitem',
        title: tool.description || undefined,
      }, [
        h('span', { key: 'label', className: 'nz-tool-title' }, toolLabel(t, tool.rawName)),
        h('code', { key: 'code', className: 'nz-tool-code' }, tool.name),
      ])));
    }

    function HubNode({ snapshot, status, onOpenSettings, t }) {
      const connected = status === 'connected';
      const server = snapshot?.server;
      const meta = connected && server
        ? [server.name || 'Nezha', server.version ? `v${server.version}` : '', snapshot.protocolVersion ? `MCP ${snapshot.protocolVersion}` : ''].filter(Boolean).join(' · ')
        : t(`status_${status}`);
      return h('button', {
        type: 'button', className: 'nz-node nz-node-hub', onClick: onOpenSettings,
        title: t('settings'), 'aria-label': `${t('settings')}: ${meta}`,
      }, [
        h('span', { key: 'row', className: 'nz-node-row' }, [
          h('span', { key: 'logo', className: 'nz-node-logo' }, NezhaMark({ size: 26 })),
          h('span', { key: 'name', className: 'nz-node-name' }, 'Nezha MCP'),
        ]),
        h('span', { key: 'meta', className: 'nz-node-meta' }, meta),
        h('span', { key: 'pill', className: 'nz-hub-pill' }, [t('settings'), h(Icon, { key: 'c', name: 'chevron', size: 9 })]),
      ]);
    }

    function RouteStage({ snapshot, status, serversState, groups, expanded, onToggle, onRefreshServers, onOpenSettings, t }) {
      const connected = status === 'connected';
      const summary = snapshot?.serverSummary;
      const servers = Array.isArray(snapshot?.servers) ? snapshot.servers : [];
      const serverOpen = expanded.servers === true;
      const serverGroup = h(GroupSection, {
        key: 'servers', id: 'servers', icon: 'server', label: t('group_servers'),
        meta: summary ? t('servers_summary', { online: summary.online, total: summary.total }) : t('servers_none'),
        open: serverOpen, onToggle: () => onToggle('servers'),
        action: connected
          ? h('button', {
            key: 'refresh', type: 'button', className: 'nz-group-action',
            title: t('servers_refresh'), 'aria-label': t('servers_refresh'),
            disabled: serversState.loading, onClick: event => { event.stopPropagation(); onRefreshServers(); },
          }, serversState.loading ? h('span', { className: 'nz-spinner' }) : h(Icon, { name: 'refresh', size: 13 }))
          : null,
      }, serverOpen
        ? (serversState.loading && servers.length === 0
          ? h('div', { key: 'loading', className: 'nz-empty' }, t('servers_loading'))
          : h(ServerRows, { key: 'rows', servers, t }))
        : null);

      const toolGroups = groups.map(group => {
        const open = expanded[group.id] !== false;
        return h(GroupSection, {
          key: group.id, id: group.id, icon: group.icon, label: t(group.labelKey),
          meta: t('tools_count', { count: group.tools.length }),
          open, onToggle: () => onToggle(group.id),
        }, open ? h(ToolRows, { key: 'rows', tools: group.tools, t }) : null);
      });

      return h('div', { className: 'nz-stage', 'data-state': status, role: 'group', 'aria-label': t('routeTitle') }, [
        h('div', { key: 'host', className: 'nz-col nz-col-host' }, h('div', { className: 'nz-node' }, [
          h('span', { key: 'row', className: 'nz-node-row' }, [
            h('span', { key: 'logo', className: 'nz-node-logo' }, h(Icon, { name: 'host', size: 16 })),
            h('span', { key: 'name', className: 'nz-node-name' }, 'DeepSeek Harness'),
          ]),
          h('span', { key: 'meta', className: 'nz-node-meta' }, 'Agent · mcp__nezha__*'),
        ])),
        h('span', { key: 'wire-1', className: 'nz-wire nz-wire-host', 'aria-hidden': 'true' }),
        h('div', { key: 'hub', className: 'nz-col nz-col-hub' }, h(HubNode, {
          snapshot, status, onOpenSettings, t,
        })),
        h('span', { key: 'wire-2', className: 'nz-wire nz-wire-hub', 'aria-hidden': 'true' }),
        h('div', { key: 'groups', className: 'nz-col nz-col-groups' },
          h('div', { className: 'nz-groups' }, groups.length === 0 && servers.length === 0 && !connected
            ? h('div', { key: 'empty', className: 'nz-group' }, h('div', { className: 'nz-empty' }, t('tools_empty')))
            : [serverGroup, ...toolGroups])),
      ]);
    }

    // ---------------------------------------------------------------------
    // Dialogs
    // ---------------------------------------------------------------------

    function Modal({ title, onClose, children, footer, wide }) {
      const element = useRef(null);
      const closeRef = useRef(onClose);
      closeRef.current = onClose;
      useEffect(() => {
        const previous = typeof document !== 'undefined' ? document.activeElement : null;
        const node = element.current;
        const focusables = () => {
          if (!node) return [];
          return Array.from(node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
            .filter(item => !item.disabled && item.offsetParent !== null);
        };
        const first = focusables()[0];
        try { first?.focus?.(); } catch {}
        const onKeyDown = event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeRef.current();
            return;
          }
          if (event.key !== 'Tab') return;
          const items = focusables();
          if (items.length === 0) return;
          const firstItem = items[0];
          const lastItem = items[items.length - 1];
          if (event.shiftKey && document.activeElement === firstItem) {
            event.preventDefault();
            lastItem.focus();
          } else if (!event.shiftKey && document.activeElement === lastItem) {
            event.preventDefault();
            firstItem.focus();
          }
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
          document.removeEventListener('keydown', onKeyDown, true);
          try { previous?.focus?.(); } catch {}
        };
      }, []);
      return h('div', {
        className: 'nz-overlay',
        onMouseDown: event => { if (event.target === event.currentTarget) closeRef.current(); },
      }, h('div', {
        ref: element,
        className: `nz-dialog${wide ? ' nz-dialog-wide' : ''}`,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': title,
      }, [
        h('div', { key: 'head', className: 'nz-dialog-head' }, [
          h('h4', { key: 'title', className: 'nz-dialog-title' }, title),
          h('button', {
            key: 'close', type: 'button', className: 'nz-icon-btn nz-dialog-close',
            onClick: () => closeRef.current(), 'aria-label': 'close', title: 'close',
          }, h(Icon, { name: 'close', size: 14 })),
        ]),
        h('div', { key: 'body', className: 'nz-dialog-body' }, children),
        footer ? h('div', { key: 'foot', className: 'nz-dialog-foot' }, footer) : null,
      ]));
    }

    function SettingsDialog({ snapshot, remote, onClose, onSaved, t }) {
      const [url, setUrl] = useState(snapshot?.url ?? '');
      const [token, setToken] = useState('');
      const [showToken, setShowToken] = useState(false);
      const [enabled, setEnabled] = useState(snapshot?.enabled !== false);
      const [timeoutSec, setTimeoutSec] = useState(String(Math.round((snapshot?.timeoutMs ?? 60_000) / 1000)));
      const [clearToken, setClearToken] = useState(false);
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);
      const mounted = useRef(true);
      useEffect(() => () => { mounted.current = false; }, []);

      const tokenConfigured = snapshot?.token?.configured === true;
      const preview = endpointPreview(url);
      const trimmedUrl = url.trim();
      const urlValid = trimmedUrl === '' || preview.ok;
      const timeoutValue = Number(timeoutSec);
      const timeoutValid = Number.isInteger(timeoutValue) && timeoutValue >= 5 && timeoutValue <= 300;
      const canSave = !busy && urlValid && timeoutValid;

      async function save() {
        if (!canSave) return;
        setBusy(true);
        setError(null);
        try {
          const payload = {
            url: trimmedUrl,
            enabled,
            timeoutMs: Math.round(timeoutValue * 1000),
          };
          if (token.trim() !== '') payload.token = token.trim();
          if (clearToken) payload.clearToken = true;
          const value = await invoke(remote, 'save', payload);
          if (value.error) {
            setError(value.error.message || t('saveFailed'));
            return;
          }
          onSaved(value.snapshot);
        } catch (failure) {
          setError(errorMessage(failure, t));
        } finally {
          if (mounted.current) setBusy(false);
        }
      }

      const urlError = !urlValid
        ? t(`urlError_${preview.code}`)
        : null;

      return h(Modal, {
        title: t('settingsTitle'), onClose, wide: false,
        footer: [
          h('button', {
            key: 'save', type: 'button', className: 'nz-btn nz-btn-primary',
            disabled: !canSave, onClick: save,
          }, busy ? t('saving') : t('save')),
          h('button', {
            key: 'cancel', type: 'button', className: 'nz-btn nz-btn-ghost',
            disabled: busy, onClick: onClose,
          }, t('cancel')),
          h('span', { key: 'spacer', className: 'nz-spacer' }),
          tokenConfigured
            ? h('button', {
              key: 'clear', type: 'button', className: 'nz-btn nz-btn-danger nz-btn-sm',
              disabled: busy,
              onClick: () => { setClearToken(value => !value); if (!clearToken) setToken(''); },
            }, clearToken ? `${t('clearToken')} ✓` : t('clearToken'))
            : null,
        ],
      }, [
        h('div', { key: 'grid', className: 'nz-form-grid' }, [
          h('label', { key: 'url', className: 'nz-field nz-span-2' }, [
            h('span', { key: 'label', className: 'nz-label' }, t('urlLabel')),
            h('input', {
              key: 'input', className: 'nz-input', type: 'url', value: url,
              placeholder: 'https://nezha.example.com', spellCheck: false, autoComplete: 'url',
              disabled: busy, onChange: event => setUrl(event.target.value),
            }),
            urlError
              ? h('span', { key: 'error', className: 'nz-form-error' }, urlError)
              : h('span', { key: 'hint', className: 'nz-hint' },
                trimmedUrl === '' ? t('urlEmptyHint') : t('urlPreview', { endpoint: preview.endpoint })),
          ]),
          h('label', { key: 'token', className: 'nz-field nz-span-2' }, [
            h('span', { key: 'label', className: 'nz-label' }, [
              t('tokenLabel'),
              h('em', { key: 'badge', className: 'nz-badge', 'data-tone': tokenConfigured ? 'ok' : 'warn' },
                tokenConfigured ? t('tokenSaved') : t('tokenMissing')),
            ]),
            h('span', { key: 'wrap', className: 'nz-input-wrap' }, [
              h('input', {
                key: 'input', className: 'nz-input', type: showToken ? 'text' : 'password',
                value: token, placeholder: tokenConfigured ? t('tokenKeep') : 'nzp_...',
                spellCheck: false, autoComplete: 'new-password', disabled: busy,
                onChange: event => { setToken(event.target.value); if (event.target.value !== '') setClearToken(false); },
              }),
              h('button', {
                key: 'toggle', type: 'button', className: 'nz-icon-btn nz-input-action',
                title: showToken ? t('tokenHide') : t('tokenShow'),
                'aria-label': showToken ? t('tokenHide') : t('tokenShow'),
                onClick: () => setShowToken(value => !value),
              }, h(Icon, { name: showToken ? 'eyeOff' : 'eye', size: 14 })),
            ]),
            h('span', { key: 'hint', className: 'nz-hint' }, t('tokenHint')),
          ]),
          h('label', { key: 'timeout', className: 'nz-field' }, [
            h('span', { key: 'label', className: 'nz-label' }, t('timeoutLabel')),
            h('input', {
              key: 'input', className: 'nz-input', type: 'number', min: 5, max: 300, step: 1,
              value: timeoutSec, disabled: busy,
              onChange: event => setTimeoutSec(event.target.value),
            }),
            timeoutValid
              ? h('span', { key: 'hint', className: 'nz-hint' }, t('timeoutHint'))
              : h('span', { key: 'error', className: 'nz-form-error' }, t('timeoutError')),
          ]),
          h('div', { key: 'enabled', className: 'nz-field' }, [
            SwitchField({
              checked: enabled, disabled: busy, onChange: setEnabled,
              label: t('enabledLabel'), hint: t('enabledHint'),
            }),
          ]),
        ]),
        clearToken
          ? h('div', { key: 'clear-note', className: 'nz-hint', style: { marginTop: '10px' } }, t('clearTokenHint'))
          : null,
        error
          ? h('div', { key: 'error', className: 'nz-form-error', role: 'alert', style: { marginTop: '10px' } }, error)
          : null,
      ]);
    }

    function StepIcon({ tone }) {
      if (tone === 'run') return h('span', { className: 'nz-spinner' });
      if (tone === 'ok') return h(Icon, { name: 'check', size: 14 });
      if (tone === 'error') return h(Icon, { name: 'alert', size: 14 });
      return h(Icon, { name: 'dots', size: 14 });
    }

    function TestDialog({ remote, snapshot, onClose, t }) {
      const [phase, setPhase] = useState('confirm');
      const [result, setResult] = useState(null);
      const [failure, setFailure] = useState(null);
      const [elapsed, setElapsed] = useState(0);
      const startedAt = useRef(0);
      const mounted = useRef(true);
      useEffect(() => () => { mounted.current = false; }, []);

      useEffect(() => {
        if (phase !== 'running') return undefined;
        const timer = setInterval(() => {
          if (mounted.current) setElapsed(Date.now() - startedAt.current);
        }, 120);
        return () => clearInterval(timer);
      }, [phase]);

      const configured = snapshot?.configured === true || (snapshot?.url !== '' && snapshot?.token?.configured === true);
      const endpoint = endpointPreview(snapshot?.url ?? '');

      async function run() {
        startedAt.current = Date.now();
        setResult(null);
        setFailure(null);
        setPhase('running');
        try {
          const value = await invoke(remote, 'test', {});
          if (!mounted.current) return;
          if (value.ok) setResult(value);
          else setFailure(value.error || { message: t('unknownError') });
          setPhase('done');
        } catch (error) {
          if (!mounted.current) return;
          setFailure({ code: error?.code, message: errorMessage(error, t) });
          setPhase('done');
        }
      }

      const steps = [];
      const addressTone = endpoint.ok ? 'ok' : 'error';
      steps.push(h('div', { key: 'address', className: 'nz-step', 'data-tone': addressTone }, [
        h('span', { key: 'icon', className: 'nz-step-icon' }, h(StepIcon, { tone: addressTone })),
        h('div', { key: 'main', className: 'nz-step-main' }, [
          h('div', { key: 'title', className: 'nz-step-title' }, t('step_address')),
          h('div', { key: 'detail', className: 'nz-step-detail' },
            endpoint.ok ? endpoint.endpoint : t(`urlError_${endpoint.code}`)),
        ]),
      ]));
      if (configured) {
        const running = phase === 'running';
        const handshakeTone = running ? 'run' : failure ? 'error' : result ? 'ok' : 'idle';
        steps.push(h('div', { key: 'handshake', className: 'nz-step', 'data-tone': handshakeTone }, [
          h('span', { key: 'icon', className: 'nz-step-icon' }, h(StepIcon, { tone: handshakeTone })),
          h('div', { key: 'main', className: 'nz-step-main' }, [
            h('div', { key: 'title', className: 'nz-step-title' }, t('step_handshake')),
            h('div', { key: 'detail', className: 'nz-step-detail' },
              running ? t('step_running')
                : failure ? errorMessage(failure, t)
                  : result ? [result.server?.name || 'Nezha', result.server?.version ? `v${result.server.version}` : '', result.protocolVersion ? `MCP ${result.protocolVersion}` : ''].filter(Boolean).join(' · ')
                    : t('step_pending')),
          ]),
        ]));
        const toolsTone = running ? 'idle' : result ? 'ok' : failure ? 'error' : 'idle';
        steps.push(h('div', { key: 'tools', className: 'nz-step', 'data-tone': toolsTone }, [
          h('span', { key: 'icon', className: 'nz-step-icon' }, h(StepIcon, { tone: running ? 'idle' : toolsTone })),
          h('div', { key: 'main', className: 'nz-step-main' }, [
            h('div', { key: 'title', className: 'nz-step-title' }, t('step_tools')),
            h('div', { key: 'detail', className: 'nz-step-detail' },
              running ? t('step_pending') : result ? String(result.tools?.length ?? 0) : failure ? t('step_skipped') : t('step_pending')),
          ]),
        ]));
        const serversTone = running ? 'idle' : result ? (result.serverSummary ? 'ok' : 'idle') : failure ? 'error' : 'idle';
        steps.push(h('div', { key: 'servers', className: 'nz-step', 'data-tone': serversTone }, [
          h('span', { key: 'icon', className: 'nz-step-icon' }, h(StepIcon, { tone: running ? 'idle' : serversTone })),
          h('div', { key: 'main', className: 'nz-step-main' }, [
            h('div', { key: 'title', className: 'nz-step-title' }, t('step_servers')),
            h('div', { key: 'detail', className: 'nz-step-detail' },
              running ? t('step_pending')
                : result?.serverSummary
                  ? t('servers_summary', { online: result.serverSummary.online, total: result.serverSummary.total })
                  : result ? t('step_skipped') : failure ? t('step_skipped') : t('step_pending')),
          ]),
        ]));
      }

      const resultView = result
        ? h('div', { key: 'ok', className: 'nz-result', 'data-tone': 'ok' }, [
          h('div', { key: 'title', className: 'nz-result-title' }, [h(Icon, { key: 'i', name: 'check', size: 14 }), t('testDone')]),
          h('dl', { key: 'kv', className: 'nz-kv' }, [
            h('dt', { key: 'server-k' }, t('result_server')),
            h('dd', { key: 'server-v' }, [result.server?.name || 'Nezha', result.server?.version ? ` · v${result.server.version}` : ''].filter(Boolean).join('')),
            h('dt', { key: 'protocol-k' }, t('result_protocol')),
            h('dd', { key: 'protocol-v' }, result.protocolVersion || '—'),
            h('dt', { key: 'tools-k' }, t('result_tools')),
            h('dd', { key: 'tools-v' }, String(result.tools?.length ?? 0)),
            h('dt', { key: 'servers-k' }, t('result_servers')),
            h('dd', { key: 'servers-v' }, result.serverSummary
              ? t('servers_summary', { online: result.serverSummary.online, total: result.serverSummary.total })
              : t('step_skipped')),
          ]),
        ])
        : failure
          ? h('div', { key: 'error', className: 'nz-result', 'data-tone': 'error', role: 'alert' }, [
            h('div', { key: 'title', className: 'nz-result-title' }, [h(Icon, { key: 'i', name: 'alert', size: 14 }), t('banner_error_title')]),
            h('p', { key: 'message', className: 'nz-result-note' }, errorMessage(failure, t)),
            h('p', { key: 'hint', className: 'nz-result-note' }, t(errorHintKey(failure.code))),
          ])
          : null;

      return h(Modal, {
        title: t('testTitle'), onClose, wide: true,
        footer: [
          phase === 'confirm'
            ? h('button', {
              key: 'start', type: 'button', className: 'nz-btn nz-btn-primary',
              disabled: !endpoint.ok || !configured, onClick: run,
            }, [h(Icon, { key: 'i', name: 'play', size: 12 }), t('testStart')])
            : phase === 'running'
              ? h('button', { key: 'running', type: 'button', className: 'nz-btn nz-btn-primary', disabled: true },
                [h('span', { key: 's', className: 'nz-spinner' }), t('testRunning')])
              : h('button', { key: 'again', type: 'button', className: 'nz-btn nz-btn-primary', onClick: run },
                [h(Icon, { key: 'i', name: 'refresh', size: 12 }), t('testAgain')]),
          phase === 'done' ? h('span', { key: 'elapsed', className: 'nz-elapsed' }, t('testElapsed', { value: (elapsed / 1000).toFixed(1) })) : null,
          h('span', { key: 'spacer', className: 'nz-spacer' }),
          h('button', { key: 'close', type: 'button', className: 'nz-btn nz-btn-ghost', onClick: onClose }, t('close')),
        ],
      }, [
        h('p', { key: 'intro', className: 'nz-hint' }, configured ? t('testIntro') : t('testNoConfig')),
        h('div', { key: 'steps', className: 'nz-steps', role: 'list' }, steps),
        resultView,
      ]);
    }

    // ---------------------------------------------------------------------
    // Main page
    // ---------------------------------------------------------------------

    function LoadingState({ t, error }) {
      return h('section', { className: 'dsh-nezha', 'data-dsh-nezha': '1' }, [
        h('style', { key: 'style' }, CSS),
        error
          ? h(Banner, { key: 'error', tone: 'error', icon: 'alert', title: t('status_error'), body: error, actions: [], onDismiss: null, t })
          : h('div', { key: 'loading', className: 'nz-loading' }, [h('span', { key: 's', className: 'nz-spinner' }), t('loading')]),
      ]);
    }

    function ConfigPage({ remote, t = key => key }) {
      const [snapshot, setSnapshot] = useState(null);
      const [loadError, setLoadError] = useState(null);
      const [notice, setNotice] = useState(null);
      const [dialog, setDialog] = useState(null);
      const [busy, setBusy] = useState('');
      const [toast, setToast] = useState('');
      const [expanded, setExpanded] = useState({});
      const [serversState, setServersState] = useState({ loading: false, error: null });
      const mounted = useRef(true);

      useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
      }, []);

      useEffect(() => {
        let active = true;
        (async () => {
          try {
            const value = await invoke(remote, 'snapshot');
            if (!active) return;
            setSnapshot(value);
          } catch (error) {
            if (active) setLoadError(errorMessage(error, t));
          }
        })();
        return () => { active = false; };
      }, [remote]);

      const status = snapshot?.status ?? 'idle';
      useEffect(() => {
        if (status !== 'connecting') return undefined;
        const timer = setInterval(async () => {
          try {
            const value = await invoke(remote, 'snapshot');
            if (mounted.current) setSnapshot(value);
          } catch {}
        }, 1500);
        return () => clearInterval(timer);
      }, [status, remote]);

      useEffect(() => {
        if (toast === '') return undefined;
        const timer = setTimeout(() => { if (mounted.current) setToast(''); }, 2400);
        return () => clearTimeout(timer);
      }, [toast]);

      useEffect(() => {
        if (!notice || notice.kind !== 'ok') return undefined;
        const timer = setTimeout(() => { if (mounted.current) setNotice(null); }, 7000);
        return () => clearTimeout(timer);
      }, [notice]);

      async function refreshTools() {
        setBusy('refresh');
        setNotice(null);
        try {
          const value = await invoke(remote, 'refresh');
          if (!mounted.current) return;
          setSnapshot(value.snapshot);
          if (value.snapshot?.error) setNotice({ kind: 'error', text: value.snapshot.error.message });
          else setNotice({ kind: 'ok', text: t('refreshedNotice') });
        } catch (error) {
          if (mounted.current) setNotice({ kind: 'error', text: errorMessage(error, t) });
        } finally {
          if (mounted.current) setBusy('');
        }
      }

      async function enable() {
        setBusy('enable');
        setNotice(null);
        try {
          const value = await invoke(remote, 'save', { enabled: true });
          if (!mounted.current) return;
          setSnapshot(value.snapshot);
          if (value.error) setNotice({ kind: 'error', text: value.error.message });
          else setNotice({ kind: 'ok', text: t('enabledNotice') });
        } catch (error) {
          if (mounted.current) setNotice({ kind: 'error', text: errorMessage(error, t) });
        } finally {
          if (mounted.current) setBusy('');
        }
      }

      async function refreshServers() {
        setServersState({ loading: true, error: null });
        try {
          const value = await invoke(remote, 'servers');
          if (!mounted.current) return;
          if (value.error) {
            setServersState({ loading: false, error: value.error.message });
            return;
          }
          setServersState({ loading: false, error: null });
          setSnapshot(current => (current
            ? { ...current, servers: value.servers, serverSummary: value.serverSummary, serversFetchedAt: value.fetchedAt }
            : current));
        } catch (error) {
          if (mounted.current) setServersState({ loading: false, error: errorMessage(error, t) });
        }
      }

      async function copyPath() {
        const path = snapshot?.settingsPath ?? '';
        if (path === '') return;
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(path);
          } else if (typeof document !== 'undefined') {
            const area = document.createElement('textarea');
            area.value = path;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            area.remove();
          }
          if (mounted.current) setToast(t('copied'));
        } catch {
          if (mounted.current) setToast(t('copyPath'));
        }
      }

      function toggleGroup(id) {
        setExpanded(current => ({ ...current, [id]: !current[id] }));
      }

      function handleSaved(next) {
        setSnapshot(next);
        setDialog(null);
        if (next?.status === 'error' && next.error?.message) {
          setNotice({ kind: 'error', text: next.error.message });
          return;
        }
        setNotice({ kind: 'ok', text: t('savedNotice') });
      }

      if (snapshot === null) return h(LoadingState, { t, error: loadError });

      const groups = groupTools(snapshot.tools);
      const summary = snapshot.serverSummary;
      const tone = statusTone(status);
      const showSavedToast = toast !== '';

      const banner = notice
        ? { tone: notice.kind === 'error' ? 'error' : 'ok', icon: notice.kind === 'error' ? 'alert' : 'check', title: notice.kind === 'error' ? t('banner_error_title') : null, body: notice.text, actions: [], dismiss: () => setNotice(null) }
        : status === 'disabled'
          ? { tone: 'warn', icon: 'info', title: t('banner_disabled_title'), body: t('banner_disabled_body'), actions: [h('button', { key: 'enable', type: 'button', className: 'nz-btn nz-btn-primary nz-btn-sm', disabled: busy !== '', onClick: enable }, t('enable'))] }
          : status === 'connected' && snapshot.token?.writable === false
            ? { tone: 'warn', icon: 'info', title: null, body: t('banner_token_readonly'), actions: [] }
            : status === 'idle'
              ? { tone: 'warn', icon: 'info', title: t('banner_idle_title'), body: t('banner_idle_body'), actions: [h('button', { key: 'settings', type: 'button', className: 'nz-btn nz-btn-primary nz-btn-sm', onClick: () => setDialog('settings') }, t('settings'))] }
              : status === 'error'
                ? { tone: 'error', icon: 'alert', title: t('banner_error_title'), body: snapshot.error?.message || t('unknownError'), actions: [
                  h('button', { key: 'retry', type: 'button', className: 'nz-btn nz-btn-primary nz-btn-sm', disabled: busy !== '', onClick: refreshTools }, t('retry')),
                  h('button', { key: 'settings', type: 'button', className: 'nz-btn nz-btn-sm', onClick: () => setDialog('settings') }, t('settings')),
                ] }
                : null;

      return h('section', { className: 'dsh-nezha', 'data-dsh-nezha': '1' }, [
        h('style', { key: 'style' }, CSS),
        h('div', { key: 'route', className: 'nz-route' }, [
          h('div', { key: 'head', className: 'nz-head' }, [
            h('h3', { key: 'title', className: 'nz-title' }, t('routeTitle')),
            h(StatusPill, { key: 'status', status, t }),
            h('span', { key: 'strip', className: 'nz-spacer', style: { display: 'inline-flex' } }, h(Strip, { connected: status === 'connected' })),
            h('div', { key: 'actions', className: 'nz-head-actions' }, [
              h('button', {
                key: 'test', type: 'button', className: 'nz-btn nz-btn-primary',
                onClick: () => setDialog('test'),
              }, [h(Icon, { key: 'i', name: 'play', size: 12 }), t('test')]),
              h('button', {
                key: 'settings', type: 'button', className: 'nz-btn',
                onClick: () => setDialog('settings'),
              }, t('settings')),
            ]),
          ]),
          banner
            ? h(Banner, {
              key: 'banner', tone: banner.tone, icon: banner.icon, title: banner.title, body: banner.body,
              actions: banner.actions, onDismiss: banner.dismiss ?? null, t,
            })
            : null,
          h(RouteStage, {
            key: 'stage', snapshot, status, serversState, groups, expanded,
            onToggle: toggleGroup, onRefreshServers: refreshServers,
            onOpenSettings: () => setDialog('settings'), t,
          }),
          serversState.error
            ? h('div', { key: 'servers-error', className: 'nz-hint', style: { padding: '0 14px 8px' } }, serversState.error)
            : null,
          h('div', { key: 'foot', className: 'nz-foot' }, [
            h('span', { key: 'label', className: 'nz-foot-label' }, t('configFile')),
            snapshot.settingsPath
              ? h('code', { key: 'path', className: 'nz-foot-path', title: snapshot.settingsPath }, snapshot.settingsPath)
              : null,
            snapshot.settingsPath
              ? h('button', { key: 'copy', type: 'button', className: 'nz-btn nz-btn-ghost nz-btn-sm', onClick: copyPath },
                [h(Icon, { key: 'i', name: 'copy', size: 11 }), t('copyPath')])
              : null,
            h('span', { key: 'tag', className: 'nz-foot-tag' }, t('patStored')),
            summary
              ? h('span', { key: 'fetched', className: 'nz-foot-label' }, t('servers_fetched', { time: formatClock(snapshot.serversFetchedAt) || '—' }))
              : null,
            h('span', { key: 'spacer', className: 'nz-spacer' }),
            h('button', {
              key: 'refresh', type: 'button', className: 'nz-btn nz-btn-ghost nz-btn-sm',
              disabled: busy !== '' || !snapshot.configured, onClick: refreshTools,
            }, [h(Icon, { key: 'i', name: 'refresh', size: 11 }), busy === 'refresh' ? t('refreshing') : t('refreshTools')]),
          ]),
        ]),
        status === 'connected'
          ? h('p', { key: 'hint', className: 'nz-hint', style: { margin: 0 } }, t('tools_hint'))
          : null,
        dialog === 'settings'
          ? h(SettingsDialog, { key: 'settings-dialog', snapshot, remote, t, onClose: () => setDialog(null), onSaved: handleSaved })
          : null,
        dialog === 'test'
          ? h(TestDialog, { key: 'test-dialog', snapshot, remote, t, onClose: () => setDialog(null) })
          : null,
        showSavedToast ? h('div', { key: 'toast', className: 'nz-toast', role: 'status' }, toast) : null,
      ]);
    }

    function GithubBadge({ subject }) {
      if (!subject || subject.kind !== 'bundle' || subject.pkg?.name !== 'dsh-nezha') return null;
      return h('a', {
        className: 'dsh-nezha-badge',
        href: REPOSITORY,
        target: '_blank',
        rel: 'noopener noreferrer',
        title: 'dsh-nezha on GitHub',
        'aria-label': 'dsh-nezha on GitHub',
      }, h(Icon, { name: 'github', size: 16, strokeWidth: 1.2 }));
    }

    async function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-nezha: locale');
      const unmountRemote = await ctx.remote.$mount({ package: 'dsh-nezha', descriptors });
      ctx.inject(['remote.nezhaSettings', 'slots', 'locale'], scoped => {
        scoped.slots.inject('plugins.bundle.config', () => scoped.slots.register({
          name: 'plugins.bundle.config',
          key: 'dsh-nezha',
          locale: NS,
          order: 30,
          inject: () => ({ remote: scoped.remote, t: scoped.locale.bind(NS) }),
        }, ConfigPage));
        scoped.slots.inject('plugins.detail.badge', () => scoped.slots.register({
          name: 'plugins.detail.badge',
          id: 'dsh-nezha-github',
          locale: NS,
          order: 30,
        }, GithubBadge));
      });
      return async () => {
        await unmountRemote();
      };
    }

    return {
      NS,
      inject,
      apply,
      helpers: Object.freeze({
        groupTools,
        toolGroupId,
        toolLabel,
        toolLabelKey,
        errorHintKey,
        statusTone,
        summarizeServers,
        endpointPreview,
      }),
    };
  },
});
