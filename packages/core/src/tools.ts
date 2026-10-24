// The Tools hub (SPEC 5.11): every occasional tool in one place, up to four of them pinned to
// Today's row. Which tools exist is per platform (Fajr Rise is mobile only), so the apps pass the
// ones they have.

export const toolIds = ['qibla', 'calendar', 'rise', 'tasbih'] as const;
export type ToolId = (typeof toolIds)[number];

export const MAX_PINNED = 4;
export const defaultPinned: readonly ToolId[] = ['qibla', 'calendar'];

/** The pinned tools this platform has, in the order they were pinned. */
export function pinnedTools(pinned: readonly ToolId[], available: readonly ToolId[]): ToolId[] {
  return [...new Set(pinned)].filter((id) => available.includes(id)).slice(0, MAX_PINNED);
}

/** Pins or unpins a tool; a fifth pin is refused (null), so the screen can say why. */
export function togglePin(pinned: readonly ToolId[], id: ToolId): ToolId[] | null {
  if (pinned.includes(id)) return pinned.filter((p) => p !== id);
  if (pinned.length >= MAX_PINNED) return null;
  return [...pinned, id];
}
