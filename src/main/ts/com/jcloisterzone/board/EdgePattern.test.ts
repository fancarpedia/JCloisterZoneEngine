import { describe, it, expect } from "vitest";
import { EdgePattern } from "./EdgePattern.js";
import { EdgeType } from "./EdgeType.js";
import { Location } from "./Location.js";
import { Rotation } from "./Rotation.js";
import { TileSymmetry } from "./TileSymmetry.js";

describe("EdgePattern", () => {
  it("fromString / at / toString roundtrip", () => {
    const ep = EdgePattern.fromString("CRFI");
    expect(ep.at(Location.N)).toBe(EdgeType.CITY);
    expect(ep.at(Location.E)).toBe(EdgeType.ROAD);
    expect(ep.at(Location.S)).toBe(EdgeType.FIELD);
    expect(ep.at(Location.W)).toBe(EdgeType.RIVER);
    expect(ep.toString()).toBe("CRFI");
  });

  it("rotate shifts edges clockwise", () => {
    // N=C,E=R,S=F,W=I rotated +90 -> N=W_old(I),E=N_old(C),S=E_old(R),W=S_old(F)
    const ep = EdgePattern.fromString("CRFI").rotate(Rotation.R90);
    expect(ep.toString()).toBe("ICRF");
  });

  it("symmetry detection", () => {
    expect(EdgePattern.fromString("FFFF").getSymmetry()).toBe(TileSymmetry.S4);
    expect(EdgePattern.fromString("CFCF").getSymmetry()).toBe(TileSymmetry.S2);
    expect(EdgePattern.fromString("CRFI").getSymmetry()).toBe(TileSymmetry.NONE);
  });

  it("equality is rotation-invariant (canonical)", () => {
    const a = EdgePattern.fromString("CRFR");
    const b = a.rotate(Rotation.R180);
    expect(a.equals(b)).toBe(true);
    expect(a.hashCode()).toBe(b.hashCode());
  });

  it("isMatchingExact with wildcards", () => {
    const border = EdgePattern.fromString("????"); // all ANY
    const tile = EdgePattern.fromString("CRFR");
    expect(border.isMatchingExact(tile)).toBe(true);
    expect(EdgePattern.fromString("CCCC").isMatchingExact(EdgePattern.fromString("RRRR"))).toBe(false);
  });

  it("wildcardSize counts ANY edges", () => {
    expect(EdgePattern.fromString("??CR").wildcardSize()).toBe(2);
  });
});
