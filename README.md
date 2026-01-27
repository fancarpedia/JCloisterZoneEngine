
# JCloisterZoneEngine

JCloisterZoneEngine is backend for [FanCloisterZone Edition](
https://github.com/fancarpedia/FanCloisterZone/) as fork of [JCloisterZone](https://github.com/farin/JCloisterZone).

## Development helpers

### Dump features map
```
    System.err.println("# features: " + state.getFeatureMap().mapValues(m -> m.toJavaMap()).toJavaMap());
```
### Get Feature object from FeaturePointer
```
    FeaturePointer fp;
    Feature feature = state.getFeature(fp);
```

### Get FeaturePointer for Feature
Usually is used feature pointer of figure placed on feature. This is for case, that feature is unoccupied, or it has no neutral figure there (like Witch/Mage).
```
    Feature f;
    FeaturePointer fp = state.getFeaturePointer(f);
```

### Traits - Append requested existing mechanics to Featuers / Figures / etc.
Traits are defined as 
```
com.jcloisterzone.game.capability.trait.RequiredStuffName
```
and used in object as 
```
class ObjectName implement RequiredStuffName
```

**Known traits**
_Official expansions:_
1. BuilderExtendable - each feature which is extendable by Builder
2. WagonEligible - if it is possible to place wagon to a feature 

_Fan-expansions:_
1. FlowersBonusAffected - feature and special figure affected by Flowers on tiles during scoring
2. MeteoriteProtected - features protected agains Meteorite impact - all meeples and stuff placed there kept untouch
3. FeatureCompletionBlocker - contains `isFeatureCompletionBlocked()` to test if it not possible to complete a feature, like Tunnel token placement join and finish with 2nd road with Donkey.  
