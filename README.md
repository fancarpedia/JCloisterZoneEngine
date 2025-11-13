
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
    Feature feature;
    FeaturePointer fp = state.getFeaturePointer(f);
```
