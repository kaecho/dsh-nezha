import { SETTINGS_DESCRIPTORS } from './descriptors.js';

/**
 * Host-face Typert manifest for the plugin's Remote settings service.
 * The values are plain descriptor records, so this module is safe to import
 * from the Loader without a generated build artifact.
 */
export const TYPERT = Object.freeze({
  package: 'dsh-nezha',
  face: 'host',
  schemas: [],
  invocations: SETTINGS_DESCRIPTORS,
  model: Object.freeze({ services: [], events: [], objects: [] }),
});

export default TYPERT;

export function clientContribution() {
  return Object.freeze({
    package: 'dsh-nezha',
    descriptors: SETTINGS_DESCRIPTORS.map(descriptor => Object.freeze({
      id: descriptor.id,
      service: descriptor.service,
      namespace: descriptor.namespace,
      method: descriptor.method,
      description: descriptor.description,
      invocation: descriptor.invocation,
      parameters: descriptor.parameters,
      result: descriptor.result,
    })),
  });
}
