/**
 * Thrown by engines that are architected but not yet implemented (see
 * section 41 of the master prompt: "do not build fake sophistication").
 * Routes and UI must catch this explicitly and surface it as a clearly
 * labeled "not yet available" state — never as a generated result.
 */
export class NotImplementedError extends Error {
  constructor(engine: string) {
    super(`${engine} is not implemented yet. The data model and interface exist; the execution logic does not.`);
    this.name = 'NotImplementedError';
  }
}
