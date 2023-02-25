export * from './fetch';

export * from './scheduler';

export function padLeft(text: string, len: number) {
  return ' '.repeat(Math.max(0, len - text.length)) + text;
}
