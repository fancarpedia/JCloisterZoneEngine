package src.main.java.com.jcloisterzone.game.phase;

import com.jcloisterzone.Player;
import com.jcloisterzone.action.TilePlacementAction;
import com.jcloisterzone.board.PlacementOption;
import com.jcloisterzone.board.Tile;
import com.jcloisterzone.game.capability.AbbeyCapability;
import com.jcloisterzone.game.capability.AbbeyCapability.AbbeyToken;
import com.jcloisterzone.game.capability.BazaarCapability;
import com.jcloisterzone.game.capability.BazaarCapabilityModel;
import com.jcloisterzone.game.capability.BuilderCapability;
import com.jcloisterzone.game.capability.BuilderState;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.PlaceTileMessage;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.PlaceTile;

import io.vavr.collection.List;
import io.vavr.collection.Set;
import io.vavr.collection.Vector;

public class TileFromSupplyPhase extends AbstractAbbeyPhase {

    private TilePhase tilePhase;
    private ActionPhase actionPhase;

    public TileFromSupplyPhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    public void setTilePhase(TilePhase tilePhase) {
        this.tilePhase = tilePhase;
    }

    public void setActionPhase(ActionPhase actionPhase) {
        this.actionPhase = actionPhase;
    }

    @Override
    public StepResult enter(GameState state) {
    	
    	if (!isBazaarInProgress(state)) {
            Vector actions = Vector.empty();

            boolean abbeyIncluded = false;
        
            if (isAbbeyPlacementAllowed(state)) {
                TilePlacementAction action = createAbbeyAction(state);
                if (action != null) {
                    abbeyIncluded = true;
                    actions = actions.append(action);
                }
            }

            List<Tile> handTiles = state.getTilesInPlayerSupply(state.getTurnPlayer());
            if (handTiles.length()>0) {
                for(Tile tile: handTiles) {
                    Set<PlacementOption> placements = state.getTilePlacements(tile).toSet();

                    if (!placements.isEmpty()) {
                        actions = actions.append(new TilePlacementAction(tile, placements));
                    }
                }
            }

            if (actions.length()>0) {
                state = state.setPlayerActions(new ActionsState(
                    state.getTurnPlayer(),
                    actions,
                    abbeyIncluded && (actions.length()==1) // Can pass only if only Abbey is in action
                ));
                return promote(state);
            }
    	}
        return next(state, tilePhase);
    }

    @PhaseMessageHandler
    public StepResult handlePlaceTile(GameState state, PlaceTileMessage msg) {
    	if (isTileFromPlayerSupply(state, msg.getTileId())) {
    		state = applyPlaceTile(state, msg);
    		return next(state, actionPhase);
    	} else {
    		return next(state, tilePhase);
    	}
    }
    
    protected boolean isAbbeyPlacementAllowed(GameState state) {
        BuilderState builderState = state.getCapabilityModel(BuilderCapability.class);
        boolean builderSecondTurnPart = builderState == BuilderState.SECOND_TURN;
        boolean bazaarInProgress = isBazaarInProgress(state);
        boolean hasAbbey = (state.getPlayers().getPlayerTokenCount(state.getTurnPlayer().getIndex(), AbbeyToken.ABBEY_TILE) > 0);
        // Not checking if hole exists
        return (hasAbbey && (builderSecondTurnPart || !bazaarInProgress));
    }
    
    protected boolean isBazaarInProgress(GameState state) {
        BazaarCapabilityModel bazaarModel = state.getCapabilityModel(BazaarCapability.class);
        return bazaarModel != null &&  bazaarModel.getSupply() != null;
    }
    
    protected boolean isTileFromPlayerSupply(GameState state, String tileId) {
    	boolean abbeyTile = tileId.equals(AbbeyCapability.ABBEY_TILE_ID) && isAbbeyPlacementAllowed(state);
    	boolean bazzarInProgress = isBazaarInProgress(state);
    	List<Tile> supplyTiles = state.getTilesInPlayerSupply(state.getTurnPlayer());
    	boolean supplyTile = (!supplyTiles.isEmpty() && supplyTiles.map(t -> t.getId()).contains(tileId));
        return (!bazzarInProgress && (abbeyTile || supplyTile));
    }
    
    @Override
    protected GameState applyPlaceTile(GameState state, PlaceTileMessage msg) {

        Player player = state.getActivePlayer();
        if (msg.getTileId().equals(AbbeyCapability.ABBEY_TILE_ID)) {
        	if (!isAbbeyPlacementAllowed(state)) {
            	throw new IllegalArgumentException("Abbey tile is not possible to place now.");
        	}
            state = state.mapPlayers(ps ->
                ps.addTokenCount(player.getIndex(), AbbeyCapability.AbbeyToken.ABBEY_TILE, -1)
            );
            state = (new PlaceTile(AbbeyCapability.ABBEY_TILE, msg.getPosition(), msg.getRotation())).apply(state);
        } else {
        	if (isBazaarInProgress(state)) {
            	throw new IllegalArgumentException("Tile from supply is not allowed to place when Bazaar is in progress.");
        	}
            List<Tile> supplyTiles = state.getTilesInPlayerSupply(state.getTurnPlayer());
        	if (!supplyTiles.isEmpty()) {
        		if (!supplyTiles.map(t -> t.getId()).contains(msg.getTileId())) {
                	throw new IllegalArgumentException("Only tile from player supply can be placed.");
                }
        		// TODO Remove tile from playerSupply
        		Tile tile = supplyTiles.find(t -> t.getId().equals(msg.getTileId())).get();
        		state = (new PlaceTile(tile, msg.getPosition(), msg.getRotation())).apply(state);
        	}
        }
        state = clearActions(state);
        return state;
    }

}
