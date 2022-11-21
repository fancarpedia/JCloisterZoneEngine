package com.jcloisterzone.game.state;

import com.jcloisterzone.Immutable;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.BoardPointer;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.figure.neutral.*;
import io.vavr.collection.LinkedHashMap;

import java.io.Serializable;

@Immutable
public class NeutralFiguresState implements Serializable {

    private static final long serialVersionUID = 1L;

    private final Dragon dragon;
    private final Fairy fairy;
    private final Mage mage;
    private final Witch witch;
    private final Count count;
    private final BigTop bigtop;
    private final Courier courier;

    private final LinkedHashMap<NeutralFigure<?>, BoardPointer> deployedNeutralFigures;

    public NeutralFiguresState() {
        this(null, null, null, null, null, null, null, LinkedHashMap.empty());
    }

    public NeutralFiguresState(
        Dragon dragon, Fairy fairy, Mage mage, Witch witch, Count count, BigTop bigtop, Courier courier,
        LinkedHashMap<NeutralFigure<?>, BoardPointer> deployedNeutralFigures
    ) {
        this.dragon = dragon;
        this.fairy = fairy;
        this.mage = mage;
        this.witch = witch;
        this.count = count;
        this.bigtop = bigtop;
        this.courier= courier;
        this.deployedNeutralFigures = deployedNeutralFigures;
    }

    public NeutralFiguresState setDragon(Dragon dragon) {
        return new NeutralFiguresState(dragon, fairy, mage, witch, count, bigtop, courier, deployedNeutralFigures);
    }

    public NeutralFiguresState setFairy(Fairy fairy) {
        return new NeutralFiguresState(dragon, fairy, mage, witch, count, bigtop, courier, deployedNeutralFigures);
    }

    public NeutralFiguresState setMage(Mage mage) {
        return new NeutralFiguresState(dragon, fairy, mage, witch, count, bigtop, courier, deployedNeutralFigures);
    }

    public NeutralFiguresState setWitch(Witch witch) {
        return new NeutralFiguresState(dragon, fairy, mage, witch, count, bigtop, courier, deployedNeutralFigures);
    }

    public NeutralFiguresState setCount(Count count) {
        return new NeutralFiguresState(dragon, fairy, mage, witch, count, bigtop, courier, deployedNeutralFigures);
    }

    public NeutralFiguresState setBigTop(BigTop bigtop) {
        return new NeutralFiguresState(dragon, fairy, mage, witch, count, bigtop, courier, deployedNeutralFigures);
    }

    public NeutralFiguresState setCourier(Courier courier) {
        return new NeutralFiguresState(dragon, fairy, mage, witch, count, bigtop, courier, deployedNeutralFigures);
    }

    public NeutralFiguresState setDeployedNeutralFigures(LinkedHashMap<NeutralFigure<?>, BoardPointer> deployedNeutralFigures) {
        return new NeutralFiguresState(dragon, fairy, mage, witch, count, bigtop, courier, deployedNeutralFigures);
    }

    public NeutralFigure<?> getById(String figureId) {
        if (dragon != null && figureId.equals(dragon.getId())) return dragon;
        if (fairy != null && figureId.equals(fairy.getId())) return fairy;
        if (mage != null && figureId.equals(mage.getId())) return mage;
        if (witch != null && figureId.equals(witch.getId())) return witch;
        if (count != null && figureId.equals(count.getId())) return count;
        if (bigtop != null && figureId.equals(bigtop.getId())) return bigtop;
        if (courier != null && figureId.equals(courier.getId())) return courier;
        return null;
    }

    public Dragon getDragon() {
        return dragon;
    }

    public Position getDragonDeployment() {
        var bp = deployedNeutralFigures.get(dragon).getOrNull();
        if (bp != null) {
        	return bp.getPosition();
        }
        return null;
    }

    public Fairy getFairy() {
        return fairy;
    }

    public BoardPointer getFairyDeployment() {
        return deployedNeutralFigures.get(fairy).getOrNull();
    }

    public Mage getMage() {
        return mage;
    }

    public FeaturePointer getMageDeployment() {
        return (FeaturePointer) deployedNeutralFigures.get(mage).getOrNull();
    }

    public Witch getWitch() {
        return witch;
    }

    public FeaturePointer getWitchDeployment() {
        return (FeaturePointer) deployedNeutralFigures.get(witch).getOrNull();
    }

    public Count getCount() {
        return count;
    }

    public FeaturePointer getCountDeployment() {
        return (FeaturePointer) deployedNeutralFigures.get(count).getOrNull();
    }

    public BigTop getBigTop() {
        return bigtop;
    }

    public Position getBigTopDeployment() {
        return (Position) deployedNeutralFigures.get(bigtop).getOrNull();
    }

    public Courier getCourier() {
        return courier;
    }

    public FeaturePointer getCourierDeployment() {
        return (FeaturePointer) deployedNeutralFigures.get(courier).getOrNull();
    }

    public LinkedHashMap<NeutralFigure<?>, BoardPointer> getDeployedNeutralFigures() {
        return deployedNeutralFigures;
    }

}
