// Ported from src/test/java/com/jcloisterzone/board/LocationTest.java
import { describe, it, expect } from "vitest";
import { Location } from "./Location.js";
import { Rotation } from "./Rotation.js";

const eq = (a: Location | null, b: Location | null) =>
  a === null || b === null ? a === b : a.equals(b);

describe("Location (ported LocationTest)", () => {
  it("isPartOf", () => {
    expect(Location.E.isPartOf(Location.E)).toBe(true);
    expect(Location.N.isPartOf(Location.NW)).toBe(true);
    expect(Location.E.isPartOf(Location.NW)).toBe(false);
    expect(Location.I.isPartOf(Location.N)).toBe(false);
    expect(Location._N.isPartOf(Location.NWSE)).toBe(true);
  });

  it("union", () => {
    expect(eq(Location.SW, Location.S.union(Location.W))).toBe(true);
    expect(eq(Location.SW, Location.W.union(Location.S))).toBe(true);
    expect(eq(Location.NWSE, Location.N.union(Location._N))).toBe(true);
  });

  it("unionExcept throws on inner", () => {
    expect(() => Location.N.union(Location.I)).toThrow();
  });

  it("subtract", () => {
    expect(eq(Location.S, Location.SW.subtract(Location.W))).toBe(true);
    expect(eq(Location.W, Location.SW.subtract(Location.S))).toBe(true);
    expect(eq(Location.N, Location.NWSE.subtract(Location._N))).toBe(true);
  });

  it("subtractExcept throws on inner", () => {
    expect(() => Location.N.subtract(Location.I)).toThrow();
  });

  it("rev", () => {
    expect(eq(Location.S, Location.N.rev())).toBe(true);
    expect(eq(Location.NL, Location.SR.rev())).toBe(true);
    expect(eq(Location.NW, Location.SE.rev())).toBe(true);
    expect(eq(Location._N, Location._S.rev())).toBe(true);
    const l1 = Location.NL.union(Location.NR.union(Location.EL));
    const l2 = Location.SL.union(Location.SR.union(Location.WR));
    expect(eq(l1, l2.rev())).toBe(true);
  });

  it("rotate", () => {
    expect(eq(Location.E, Location.N.rotateCW(Rotation.R90))).toBe(true);
    expect(eq(Location.W, Location.N.rotateCCW(Rotation.R90))).toBe(true);
    expect(eq(Location.W, Location.E.rotateCW(Rotation.R180))).toBe(true);
    expect(eq(Location.S, Location.S.rotateCCW(Rotation.R0))).toBe(true);
  });

  it("isRotationOf", () => {
    expect(Location.E.isRotationOf(Location.E)).toBe(true);
    expect(Location.E.isRotationOf(Location.N)).toBe(true);
    expect(Location.N.isRotationOf(Location.E)).toBe(true);
    expect(Location._N.isRotationOf(Location._S)).toBe(true);
    expect(Location.NW.isRotationOf(Location.NE)).toBe(true);
  });

  it("getRotationOf", () => {
    expect(Location.E.getRotationOf(Location.E)).toBe(Rotation.R0);
    expect(Location.E.getRotationOf(Location.N)).toBe(Rotation.R90);
    expect(Location.S.getRotationOf(Location.W)).toBe(Rotation.R270);
  });

  it("intersect", () => {
    expect(eq(Location.E, Location.E.intersect(Location.E))).toBe(true);
    expect(Location.E.intersect(Location.W)).toBeNull();
    expect(eq(Location.E, Location.WE.intersect(Location.SE))).toBe(true);
    expect(Location.NW.intersect(Location.NR.union(Location.EL))).toBeNull();
  });

  it("fieldToSide", () => {
    expect(eq(Location.E, Location.EL.fieldToSide())).toBe(true);
    expect(eq(Location.E, Location.ER.fieldToSide())).toBe(true);
    expect(eq(Location.E, Location.EL.union(Location.ER).fieldToSide())).toBe(true);
    expect(eq(Location.NW, Location.NL.union(Location.WR).fieldToSide())).toBe(true);
  });
});
