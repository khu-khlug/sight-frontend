const UNITS = ["B", "KB", "MB", "GB"];

export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const digits = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)}${UNITS[unitIndex]}`;
}
