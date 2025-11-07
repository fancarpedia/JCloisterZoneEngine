
# JCloisterZoneEngine

JCloisterZoneEngine is backend for [FanCloisterZone Edition](
https://github.com/fancarpedia/FanCloisterZone/) as fork of [JCloisterZone](https://github.com/farin/JCloisterZone).

## Supported Expansions

List of supported expansions can found [here](https://github.com/farin/JCloisterZone/tree/master/src/main/resources/tile-definitions).

## Development helpers

### Dump features map
`
    System.err.println("# features: " + state.getFeatureMap().mapValues(m -> m.toJavaMap()).toJavaMap());
`
### Get Feature object from FeaturePointer
`
    FeaturePointer fp;
    Feature feature = state.getFeature(fp);
`

### Get FeaturePointer for Feature
`
    ???
`
