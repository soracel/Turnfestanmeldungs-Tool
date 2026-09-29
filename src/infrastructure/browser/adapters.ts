import type { ImportInput } from '../../application/ports/browser';
export function fileInput(file: File): ImportInput {
  return { name: file.name, size: file.size, read: () => file.text() };
}
export const browserEffects = {
  today: () => new Date(),
  writeClipboard: (text: string) => navigator.clipboard.writeText(text),
  print: () => window.print(),
};
