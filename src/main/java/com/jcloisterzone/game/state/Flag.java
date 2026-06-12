package com.jcloisterzone.game.state;

public enum Flag {
    // Cleared at the turn end
    RANSOM_PAID, BAZAAR_AUCTION, TUNNEL_PLACED,

    // Cleared at the turn part end
    PORTAL_USED, NO_PHANTOM, FLYING_MACHINE_USED, 
    
    // Cleared at the turn part end, solving Tower RandomPay between ActionPhase and ConfirmPhase
    ACTION_PHASE_DONE, PHANTOM_PHASE_DONE, POST_WOOD_ACTION_STARTED, WOOD_ACTION_CONFIRMED
}