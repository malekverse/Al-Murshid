/** Join class names, skipping falsy parts. The logical-properties lint rule checks cn() calls. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
