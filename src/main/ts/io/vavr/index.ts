/**
 * Vavr-like persistent collections shim.
 *
 * Mirrors the subset of io.vavr used by the engine, with value-equality keys.
 * See {@link Valued} for the equals/hashCode protocol every key type implements.
 */
export {
  type Valued,
  isValued,
  equals,
  hashCode,
  hashString,
  hashNumber,
  hashBoolean,
  combineHash,
} from "./equality.js";

export { Option } from "./Option.js";
export { Tuple, Tuple2, Tuple3 } from "./Tuple.js";
export { Seq, type Comparator } from "./Seq.js";
export { List, Vector, Arr, Queue, Stream } from "./SeqTypes.js";
export { Map, HashMap, LinkedHashMap, TreeMap, type Entry } from "./Map.js";
export { Set, HashSet } from "./Set.js";
export { Predicates, type Predicate, type Ctor } from "./Predicates.js";
export {
  type Function0,
  type Function1,
  type Function2,
  type Function3,
  type Consumer,
  type BiConsumer,
  type Supplier,
} from "./Function.js";
