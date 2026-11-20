/**
 * The player colours, by slot — the colour a seat plays in. Shared by every expansion that hands a
 * player something of their own colour (Kingdoms' palaces: a tile with kingdom-palace="<colour>" goes
 * to the player whose slot has that colour).
 *
 * Slot = index here. Must stay in step with the client (src/renderer/utils/player-colors.js and
 * assets/styles/player-colors.scss). Colours are lower case, as written in the tile XML attributes.
 */
export class PlayerColors {
  static readonly SLOT_COLORS: readonly string[] = [
    "red", "blue", "yellow", "green", "orange", "purple", "pink", "white", "black",
    // no client slot uses these yet
    "gray", "beige", "brown",
  ];

  /** The colour of a slot (an unknown slot plays the first colour). */
  static colorOfSlot(slot: number): string {
    return PlayerColors.SLOT_COLORS[slot] ?? PlayerColors.SLOT_COLORS[0]!;
  }

  /** The slot of a colour (case-insensitive), or null when no slot has it. */
  static slotOfColor(color: string): number | null {
    const i = PlayerColors.SLOT_COLORS.indexOf(color.trim().toLowerCase());
    return i < 0 ? null : i;
  }
}
