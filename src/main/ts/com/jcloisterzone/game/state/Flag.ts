import { JavaEnum, enumValueOf } from "../../../../lang/JavaEnum.js";

/** Flags marking once-per-turn / once-per-turn-part actions. */
export class Flag extends JavaEnum {
  // Cleared at the turn end
  static readonly RANSOM_PAID = new Flag("RANSOM_PAID", 0);
  static readonly BAZAAR_AUCTION = new Flag("BAZAAR_AUCTION", 1);
  static readonly TUNNEL_PLACED = new Flag("TUNNEL_PLACED", 2);

  // Cleared at the turn part end
  static readonly PORTAL_USED = new Flag("PORTAL_USED", 3);
  static readonly NO_PHANTOM = new Flag("NO_PHANTOM", 4);
  static readonly FLYING_MACHINE_USED = new Flag("FLYING_MACHINE_USED", 5);

  // Cleared at the turn part end, solving Tower RandomPay between ActionPhase and ConfirmPhase
  static readonly ACTION_PHASE_DONE = new Flag("ACTION_PHASE_DONE", 6);
  static readonly PHANTOM_PHASE_DONE = new Flag("PHANTOM_PHASE_DONE", 7);
  static readonly POST_WOOD_ACTION_STARTED = new Flag("POST_WOOD_ACTION_STARTED", 8);
  static readonly WOOD_ACTION_CONFIRMED = new Flag("WOOD_ACTION_CONFIRMED", 9);

  // Set when the river's volcano lake (the forced-last river tile) is placed; consumed at the
  // turn end to grant the placing player another turn. Cleared at the turn end.
  static readonly RIVER_VOLCANO_DOUBLE_TURN = new Flag("RIVER_VOLCANO_DOUBLE_TURN", 10);

  // Keep Building (cooperative variant): set when the turn player enlarges an occupied
  // completable feature or occupies a new feature. Checked (and cleared with the rest)
  // at the turn end — if unset, everyone loses. Survives turn-PART cleanup (a Builder
  // double turn counts as one turn for the condition).
  static readonly COOP_CONDITION_MET = new Flag("COOP_CONDITION_MET", 11);

  // Mini Meeple (fan expansion). A Mini AWARDED this turn may not be played this turn — but any
  // OTHER Mini the player already had stays playable. The two flags together express that:
  //
  //   MINI_MEEPLE_AWARDED — a regular tile filled a hole and granted a Mini this turn.
  //   MINI_IN_SUPPLY      — the player has a Mini that is NOT the one awarded this turn: either
  //                         they already held one when the award happened, or they bought a
  //                         captured one back from a tower (PayRansom) later in the turn.
  //
  // ActionPhase offers Minis unless AWARDED is set and IN_SUPPLY is not. Both are cleared at the
  // turn PART end (with PORTAL_USED & co.) — deliberately, so a Builder double turn counts as a
  // new turn and the awarded Mini becomes playable in its second part.
  static readonly MINI_MEEPLE_AWARDED = new Flag("MINI_MEEPLE_AWARDED", 12);
  static readonly MINI_IN_SUPPLY = new Flag("MINI_IN_SUPPLY", 13);

  private static readonly VALUES: readonly Flag[] = [
    Flag.RANSOM_PAID,
    Flag.BAZAAR_AUCTION,
    Flag.TUNNEL_PLACED,
    Flag.PORTAL_USED,
    Flag.NO_PHANTOM,
    Flag.FLYING_MACHINE_USED,
    Flag.ACTION_PHASE_DONE,
    Flag.PHANTOM_PHASE_DONE,
    Flag.POST_WOOD_ACTION_STARTED,
    Flag.WOOD_ACTION_CONFIRMED,
    Flag.RIVER_VOLCANO_DOUBLE_TURN,
    Flag.COOP_CONDITION_MET,
    Flag.MINI_MEEPLE_AWARDED,
    Flag.MINI_IN_SUPPLY,
  ];

  static values(): readonly Flag[] {
    return Flag.VALUES;
  }

  static valueOf(name: string): Flag {
    return enumValueOf(Flag.VALUES, name);
  }
}
