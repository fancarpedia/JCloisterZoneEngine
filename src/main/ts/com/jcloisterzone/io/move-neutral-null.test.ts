// MOVE_NEUTRAL_FIGURE with `to: null` removes the figure (the mage or witch the player gives up
// once their features join). The parser used to dereference the null pointer and crash.
import { describe, it, expect } from "vitest";
import { MessageParser } from "./MessageParser.js";
import { MoveNeutralFigureMessage } from "./message/MoveNeutralFigureMessage.js";

describe("MOVE_NEUTRAL_FIGURE to null", () => {
  const parser = new MessageParser();

  it("parses to a message without a target", () => {
    const msg = parser.parse({ type: "MOVE_NEUTRAL_FIGURE", payload: { figureId: "witch.1", to: null } } as never);
    expect(msg).toBeInstanceOf(MoveNeutralFigureMessage);
    expect((msg as MoveNeutralFigureMessage).getTo()).toBeNull();
    expect((msg as MoveNeutralFigureMessage).getFigureId()).toBe("witch.1");
  });

  it("round-trips through the wire format", () => {
    const wire = parser.toWire(new MoveNeutralFigureMessage("mage.1", null)) as { payload: { to: unknown } };
    expect(wire.payload.to).toBeNull();
  });
});
