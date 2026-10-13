import type { ImportInput } from '../../application/ports/browser';
export function fileInput(file: File): ImportInput {
  return { name: file.name, size: file.size, read: () => file.text() };
}
export const browserEffects = {
  today: () => new Date(),
  writeClipboard: (text: string) => navigator.clipboard.writeText(text),
  print: () => window.print(),
};

export function downloadExcel(bytes: Uint8Array<ArrayBuffer>, filename: string) {
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
