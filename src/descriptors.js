/**
 * Self-contained strict codec used by both the Host service and the browser
 * descriptor copy. It validates shape and returns the same JSON value, so the
 * Remote wire never gains a second schema implementation dependency.
 */
export function createSettingsCodec(typeSymbol, jsonSchema) {
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

export const SERVICE = 'nezhaSettings';

const objectSchema = { type: 'object', additionalProperties: true };
const requestCodec = method => createSettingsCodec(`dsh-nezha/settings#${method}Request`, objectSchema);
const resultCodec = method => createSettingsCodec(`dsh-nezha/settings#${method}Result`, objectSchema);

const direct = method => ({
  id: `dsh-nezha#${SERVICE}/${method}`,
  service: SERVICE,
  namespace: SERVICE,
  method,
  description: method === 'snapshot'
    ? 'Read the Nezha MCP configuration, connection status, and registered tools.'
    : method === 'save'
      ? 'Save the Nezha endpoint, PAT, and enable state, then reconnect and refresh tools.'
      : method === 'test'
        ? 'Test a Nezha MCP endpoint and PAT without saving, returning server info and tools.'
        : 'Reconnect the saved Nezha MCP configuration and refresh the registered tools.',
  invocation: { kind: 'direct' },
  parameters: method === 'save' || method === 'test'
    ? [{ name: 'request', wire: 'request', source: 'json', codec: requestCodec(method) }]
    : [],
  result: resultCodec(method),
});

export const SETTINGS_DESCRIPTORS = Object.freeze([
  direct('snapshot'),
  direct('save'),
  direct('test'),
  direct('refresh'),
]);
