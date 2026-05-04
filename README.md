
# JCloisterZoneEngine

JCloisterZoneEngine is backend for [FanCloisterZone](
https://github.com/fancarpedia/FanCloisterZone/) as fork of [JCloisterZone](https://github.com/farin/JCloisterZone).

### Pull Request Guidelines

To avoid mistakes, submit clean, focused, and ready-to-merge pull requests.

Before starting work, discuss your idea on our Discord server.

#### One Idea per Pull Request

* One bug, feature, or refactor only
* Do not mix unrelated changes

#### Clean Commits

* One logical change per commit
* Use clear commit messages
* Keep history readable (rebase/squash if needed)

#### Ready Before Review

* Review and test your code
* Follow project style
* Pull Request should be ready to merge, not a draft

#### Handle Feedback Properly

* Address all review comments
* Update existing commits (don’t just add fixes on top)

#### Keep Pull Requests Small

* Easy to review
* Split large changes into multiple PRs

#### Pull Request Description

Include:

* What problem it solves
* What was changed

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
1. BuilderExtendable - each feature which is extendable by a Builder
2. UnaffectedByBarn - figure not affected by a Barn placement or by Field joining with a field with a Barn 
3. WagonEligible - if it is possible to place a Wagon to a feature

_Fan-expansions:_
1. FlowersBonusAffected - feature and special figure affected by Flowers on tiles during scoring
2. MeteoriteProtected - features protected agains Meteorite impact - all meeples and stuff placed there kept untouch
3. FeatureCompletionBlocker - contains `isFeatureCompletionBlocked()` to test if it not possible to complete a feature, like Tunnel token placement join and finish with 2nd road with Donkey.  
