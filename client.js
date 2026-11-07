window.__ModuleLoader__.load({
  id: 'dsh-nezha',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;

    const NS = 'plugins.dshNezha';
    const SERVICE = 'nezhaSettings';
    const inject = ['slots', 'locale', 'remote'];

    const zh = {
      title: '哪吒 MCP',
      intro: '连接哪吒监控的 MCP 服务，让 Agent 查询服务器、执行命令和读写文件。',
      urlLabel: 'Dashboard 地址',
      urlHint: '填面板根地址或完整的 /mcp 地址，保存时会自动补全 /mcp。',
      tokenLabel: 'API Token（PAT）',
      tokenSet: '已保存',
      tokenMissing: '未配置',
      tokenKeep: '已保存，留空表示不修改',
      tokenHint: '在「个人信息 → API 接口」创建 nzp_ 开头的令牌，并只授予需要的 scope。',
      enabledLabel: '启用 Nezha MCP',
      timeoutLabel: '请求超时（秒）',
      timeoutHint: '5–300 秒，命令执行等长任务可适当调大。',
      clearToken: '清除已保存的 PAT（保存时生效）',
      save: '保存并连接',
      saving: '保存中…',
      test: '测试连接',
      testing: '测试中…',
      refresh: '刷新工具',
      refreshing: '刷新中…',
      saved: '已保存，正在重新连接。',
      refreshed: '已重新读取 Nezha 工具列表。',
      testOk: '连接成功：{server}，发现 {count} 个工具。',
      testFailed: '测试连接失败。',
      status_idle: '待配置',
      status_disabled: '已停用',
      status_connecting: '连接中…',
      status_connected: '已连接',
      status_error: '连接失败',
      toolsTitle: '已注册工具',
      toolsEmpty: '连接正常，但 Nezha 没有返回工具。',
      toolsHint: '保存配置并成功连接后，这里会显示 mcp__nezha__* 工具。',
      footnote: '工具名形如 mcp__nezha__server_list，对应 Nezha 的 server.list。命令执行和文件写入使用哪吒 Agent 的运行权限，请谨慎授权。',
      loading: '正在读取配置…',
    };

    const en = {
      title: 'Nezha MCP',
      intro: 'Connects a Nezha monitoring MCP server so the agent can inspect servers, run commands, and read or write files.',
      urlLabel: 'Dashboard URL',
      urlHint: 'Enter the dashboard root or the full /mcp endpoint; /mcp is appended automatically when saving.',
      tokenLabel: 'API token (PAT)',
      tokenSet: 'Saved',
      tokenMissing: 'Not configured',
      tokenKeep: 'Saved; leave blank to keep it',
      tokenHint: 'Create an nzp_ token under Profile → API, and grant only the scopes you need.',
      enabledLabel: 'Enable Nezha MCP',
      timeoutLabel: 'Request timeout (seconds)',
      timeoutHint: '5–300 seconds; raise it for long-running commands.',
      clearToken: 'Remove the saved PAT (applies on save)',
      save: 'Save and connect',
      saving: 'Saving…',
      test: 'Test connection',
      testing: 'Testing…',
      refresh: 'Refresh tools',
      refreshing: 'Refreshing…',
      saved: 'Saved; reconnecting now.',
      refreshed: 'The Nezha tool list was refreshed.',
      testOk: 'Connected: {server}, {count} tools found.',
      testFailed: 'Connection test failed.',
      status_idle: 'Not configured',
      status_disabled: 'Disabled',
      status_connecting: 'Connecting…',
      status_connected: 'Connected',
      status_error: 'Connection failed',
      toolsTitle: 'Registered tools',
      toolsEmpty: 'Connected, but Nezha returned no tools.',
      toolsHint: 'Save the configuration and connect to see mcp__nezha__* tools here.',
      footnote: 'Tool names look like mcp__nezha__server_list, which maps to Nezha\'s server.list. Command execution and file writes run with the Nezha agent permissions, so grant them carefully.',
      loading: 'Reading configuration…',
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
        description: 'Read the Nezha MCP configuration, connection status, and registered tools.',
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
    ];
    const descriptors = rawDescriptors.map(descriptor => ({
      ...descriptor,
      parameters: descriptor.parameters.map(parameter => ({
        ...parameter,
        codec: createCodec(parameter.codec.typeSymbol, parameter.codec.jsonSchema),
      })),
      result: createCodec(descriptor.result.typeSymbol, descriptor.result.jsonSchema),
    }));

    const CSS = `
      .dsh-nezha { display:flex; flex-direction:column; gap:14px; color:var(--dsw-alias-label-primary); font-size:14px; line-height:1.5; padding:2px 0 6px; }
      .dsh-nezha .nz-header h3 { margin:0 0 4px; font-size:16px; font-weight:600; }
      .dsh-nezha .nz-header p { margin:0; color:var(--dsw-alias-label-secondary); }
      .dsh-nezha .nz-status { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:9px 12px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-2); }
      .dsh-nezha .nz-dot { inline-size:8px; block-size:8px; border-radius:50%; background:var(--dsw-alias-state-idle-primary); flex:none; }
      .dsh-nezha .nz-status.is-ok .nz-dot { background:var(--dsw-alias-state-success-primary); }
      .dsh-nezha .nz-status.is-warn .nz-dot { background:var(--dsw-alias-state-warn-primary); }
      .dsh-nezha .nz-status.is-error .nz-dot { background:var(--dsw-alias-state-error-primary); }
      .dsh-nezha .nz-status-label { font-weight:600; }
      .dsh-nezha .nz-meta { color:var(--dsw-alias-label-secondary); font-size:12px; margin-inline-start:auto; overflow-wrap:anywhere; }
      .dsh-nezha .nz-card { display:flex; flex-direction:column; gap:14px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); padding:14px; }
      .dsh-nezha .nz-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:14px; }
      .dsh-nezha .nz-field { display:flex; flex-direction:column; gap:6px; min-width:0; }
      .dsh-nezha .nz-label { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; }
      .dsh-nezha .nz-input { box-sizing:border-box; width:100%; min-height:34px; padding:7px 10px; border:1px solid var(--dsw-alias-border-l2); border-radius:7px; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font:inherit; }
      .dsh-nezha .nz-input:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; border-color:var(--dsw-alias-brand-primary); }
      .dsh-nezha .nz-input:disabled { opacity:.6; }
      .dsh-nezha .nz-hint { margin:0; color:var(--dsw-alias-label-secondary); font-size:12px; }
      .dsh-nezha .nz-badge { font-style:normal; font-size:11px; line-height:1.4; padding:1px 7px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); font-weight:400; }
      .dsh-nezha .nz-badge-ok { color:var(--dsw-alias-state-success-primary); border-color:var(--dsw-alias-state-success-primary); }
      .dsh-nezha .nz-badge-warn { color:var(--dsw-alias-state-warn-primary); border-color:var(--dsw-alias-state-warn-primary); }
      .dsh-nezha .nz-options { display:flex; flex-wrap:wrap; align-items:flex-end; gap:16px; }
      .dsh-nezha .nz-switch,.dsh-nezha .nz-check { display:inline-flex; align-items:center; gap:8px; cursor:pointer; user-select:none; font-size:13px; }
      .dsh-nezha .nz-switch input,.dsh-nezha .nz-check input { inline-size:16px; block-size:16px; margin:0; accent-color:var(--dsw-alias-brand-primary); }
      .dsh-nezha .nz-check input:disabled { cursor:not-allowed; }
      .dsh-nezha .nz-actions { display:flex; flex-wrap:wrap; gap:8px; }
      .dsh-nezha .nz-button { font:inherit; font-size:13px; padding:7px 12px; border:1px solid var(--dsw-alias-border-l2); border-radius:7px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); cursor:pointer; }
      .dsh-nezha .nz-button:hover:not(:disabled) { border-color:var(--dsw-alias-brand-primary); }
      .dsh-nezha .nz-button:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
      .dsh-nezha .nz-button:disabled { opacity:.55; cursor:not-allowed; }
      .dsh-nezha .nz-primary { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); font-weight:600; }
      .dsh-nezha .nz-notice { padding:8px 11px; border:1px solid var(--dsw-alias-border-l1); border-radius:7px; font-size:13px; overflow-wrap:anywhere; }
      .dsh-nezha .nz-notice-error { color:var(--dsw-alias-state-error-primary); border-color:var(--dsw-alias-state-error-primary); }
      .dsh-nezha .nz-notice-ok { color:var(--dsw-alias-state-success-primary); border-color:var(--dsw-alias-state-success-primary); }
      .dsh-nezha .nz-tools { display:flex; flex-direction:column; gap:8px; }
      .dsh-nezha .nz-tools-head { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
      .dsh-nezha .nz-tools-head strong { font-size:13px; }
      .dsh-nezha .nz-count { color:var(--dsw-alias-label-secondary); font-size:12px; }
      .dsh-nezha .nz-tool { display:flex; flex-direction:column; gap:2px; min-width:0; padding:7px 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:7px; }
      .dsh-nezha .nz-tool code { font-size:12px; color:var(--dsw-alias-brand-primary); overflow-wrap:anywhere; }
      .dsh-nezha .nz-tool span { font-size:12px; color:var(--dsw-alias-label-secondary); overflow-wrap:anywhere; }
      .dsh-nezha .nz-empty { margin:0; color:var(--dsw-alias-label-secondary); font-size:13px; }
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

    function ConfigPage({ remote, t = key => key }) {
      const [snapshot, setSnapshot] = useState(null);
      const [url, setUrl] = useState('');
      const [token, setToken] = useState('');
      const [enabled, setEnabled] = useState(true);
      const [timeoutSec, setTimeoutSec] = useState('60');
      const [clearToken, setClearToken] = useState(false);
      const [busy, setBusy] = useState('');
      const [notice, setNotice] = useState(null);
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
            setUrl(value.url || '');
            setEnabled(value.enabled !== false);
            setTimeoutSec(String(Math.round((value.timeoutMs ?? 60000) / 1000)));
          } catch (error) {
            if (active) setNotice({ kind: 'error', text: error.message });
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

      async function save() {
        setBusy('save');
        setNotice(null);
        try {
          const payload = {
            url,
            enabled,
            timeoutMs: Math.round(Number(timeoutSec || '60') * 1000),
          };
          if (token.trim() !== '') payload.token = token.trim();
          if (clearToken) payload.clearToken = true;
          const value = await invoke(remote, 'save', payload);
          if (!mounted.current) return;
          setSnapshot(value.snapshot);
          if (value.error) setNotice({ kind: 'error', text: value.error.message });
          else {
            setNotice({ kind: 'ok', text: t('saved') });
            setToken('');
            setClearToken(false);
          }
        } catch (error) {
          if (mounted.current) setNotice({ kind: 'error', text: error.message });
        } finally {
          if (mounted.current) setBusy('');
        }
      }

      async function test() {
        setBusy('test');
        setNotice(null);
        try {
          const payload = { url };
          if (token.trim() !== '') payload.token = token.trim();
          const value = await invoke(remote, 'test', payload);
          if (!mounted.current) return;
          if (value.ok) {
            const server = value.server?.name || 'Nezha';
            setNotice({ kind: 'ok', text: t('testOk', { server, count: value.tools?.length ?? 0 }) });
          } else {
            setNotice({ kind: 'error', text: value.error?.message || t('testFailed') });
          }
        } catch (error) {
          if (mounted.current) setNotice({ kind: 'error', text: error.message });
        } finally {
          if (mounted.current) setBusy('');
        }
      }

      async function refresh() {
        setBusy('refresh');
        setNotice(null);
        try {
          const value = await invoke(remote, 'refresh');
          if (!mounted.current) return;
          setSnapshot(value.snapshot);
          if (value.snapshot?.error) setNotice({ kind: 'error', text: value.snapshot.error.message });
          else setNotice({ kind: 'ok', text: t('refreshed') });
        } catch (error) {
          if (mounted.current) setNotice({ kind: 'error', text: error.message });
        } finally {
          if (mounted.current) setBusy('');
        }
      }

      const statusClass = status === 'connected' ? 'is-ok'
        : status === 'error' ? 'is-error'
          : status === 'connecting' ? 'is-warn' : 'is-idle';
      const disabled = busy !== '';

      if (snapshot === null) {
        return h('section', { className: 'dsh-nezha', 'data-dsh-nezha': '1' }, [
          h('style', { key: 'style' }, CSS),
          h('p', { key: 'loading', className: 'nz-empty' }, t('loading')),
        ]);
      }

      const tokenConfigured = snapshot.token?.configured === true;
      const tools = Array.isArray(snapshot.tools) ? snapshot.tools : [];

      return h('section', { className: 'dsh-nezha', 'data-dsh-nezha': '1' }, [
        h('style', { key: 'style' }, CSS),
        h('header', { key: 'header', className: 'nz-header' }, [
          h('h3', { key: 'title' }, t('title')),
          h('p', { key: 'intro' }, t('intro')),
        ]),
        h('div', {
          key: 'status',
          className: `nz-status ${statusClass}`,
          role: 'status',
          'aria-live': 'polite',
        }, [
          h('span', { key: 'dot', className: 'nz-dot', 'aria-hidden': true }),
          h('span', { key: 'label', className: 'nz-status-label' }, t(`status_${status}`)),
          snapshot.server
            ? h('span', { key: 'server', className: 'nz-meta' },
              `${snapshot.server.name || 'Nezha'}${snapshot.server.version ? ` · ${snapshot.server.version}` : ''}${snapshot.protocolVersion ? ` · MCP ${snapshot.protocolVersion}` : ''}`)
            : null,
        ]),
        snapshot.error
          ? h('div', { key: 'error', className: 'nz-notice nz-notice-error' }, snapshot.error.message)
          : null,
        h('div', { key: 'card', className: 'nz-card' }, [
          h('div', { key: 'grid', className: 'nz-grid' }, [
            h('label', { key: 'url', className: 'nz-field' }, [
              h('span', { key: 'label', className: 'nz-label' }, t('urlLabel')),
              h('input', {
                key: 'input',
                className: 'nz-input',
                type: 'url',
                value: url,
                placeholder: 'https://nezha.example.com',
                spellCheck: false,
                autoComplete: 'url',
                disabled,
                onChange: event => setUrl(event.target.value),
              }),
              h('span', { key: 'hint', className: 'nz-hint' }, t('urlHint')),
            ]),
            h('label', { key: 'token', className: 'nz-field' }, [
              h('span', { key: 'label', className: 'nz-label' }, [
                t('tokenLabel'),
                h('em', {
                  key: 'badge',
                  className: `nz-badge ${tokenConfigured ? 'nz-badge-ok' : 'nz-badge-warn'}`,
                }, tokenConfigured ? t('tokenSet') : t('tokenMissing')),
              ]),
              h('input', {
                key: 'input',
                className: 'nz-input',
                type: 'password',
                value: token,
                placeholder: tokenConfigured ? t('tokenKeep') : 'nzp_...',
                spellCheck: false,
                autoComplete: 'new-password',
                disabled,
                onChange: event => {
                  setToken(event.target.value);
                  if (event.target.value !== '') setClearToken(false);
                },
              }),
              h('span', { key: 'hint', className: 'nz-hint' }, t('tokenHint')),
            ]),
          ]),
          h('div', { key: 'options', className: 'nz-options' }, [
            h('label', { key: 'enabled', className: 'nz-switch' }, [
              h('input', {
                key: 'input',
                type: 'checkbox',
                role: 'switch',
                'aria-checked': enabled,
                checked: enabled,
                disabled,
                onChange: event => setEnabled(event.target.checked),
              }),
              h('span', { key: 'text' }, t('enabledLabel')),
            ]),
            h('label', { key: 'timeout', className: 'nz-field', style: { maxWidth: '180px' } }, [
              h('span', { key: 'label', className: 'nz-label' }, t('timeoutLabel')),
              h('input', {
                key: 'input',
                className: 'nz-input',
                type: 'number',
                min: 5,
                max: 300,
                step: 1,
                value: timeoutSec,
                disabled,
                onChange: event => setTimeoutSec(event.target.value),
              }),
              h('span', { key: 'hint', className: 'nz-hint' }, t('timeoutHint')),
            ]),
          ]),
          h('div', { key: 'actions', className: 'nz-actions' }, [
            h('button', {
              key: 'save', type: 'button', className: 'nz-button nz-primary', disabled,
              onClick: save,
            }, busy === 'save' ? t('saving') : t('save')),
            h('button', {
              key: 'test', type: 'button', className: 'nz-button', disabled,
              onClick: test,
            }, busy === 'test' ? t('testing') : t('test')),
            h('button', {
              key: 'refresh', type: 'button', className: 'nz-button', disabled: disabled || !snapshot.configured,
              onClick: refresh,
            }, busy === 'refresh' ? t('refreshing') : t('refresh')),
          ]),
          h('label', { key: 'clear', className: 'nz-check' }, [
            h('input', {
              key: 'input',
              type: 'checkbox',
              checked: clearToken,
              disabled: disabled || !tokenConfigured,
              onChange: event => {
                setClearToken(event.target.checked);
                if (event.target.checked) setToken('');
              },
            }),
            h('span', { key: 'text' }, t('clearToken')),
          ]),
          notice
            ? h('div', {
              key: 'notice',
              className: `nz-notice ${notice.kind === 'error' ? 'nz-notice-error' : 'nz-notice-ok'}`,
              role: 'status',
              'aria-live': 'polite',
            }, notice.text)
            : null,
        ]),
        tools.length > 0
          ? h('div', { key: 'tools', className: 'nz-tools' }, [
            h('div', { key: 'head', className: 'nz-tools-head' }, [
              h('strong', { key: 'title' }, t('toolsTitle')),
              h('span', { key: 'count', className: 'nz-count' }, String(tools.length)),
            ]),
            ...tools.map(tool => h('div', { key: tool.name, className: 'nz-tool' }, [
              h('code', { key: 'name' }, tool.name),
              tool.description ? h('span', { key: 'description' }, tool.description) : null,
            ])),
          ])
          : h('p', { key: 'tools-empty', className: 'nz-empty' },
            status === 'connected' ? t('toolsEmpty') : t('toolsHint')),
        h('p', { key: 'footnote', className: 'nz-hint' }, t('footnote')),
      ]);
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
      });
      return async () => {
        await unmountRemote();
      };
    }

    return { NS, inject, apply };
  },
});
