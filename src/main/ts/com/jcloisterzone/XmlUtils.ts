import { Seq } from "../../io/vavr/Seq.js";
import { Stream } from "../../io/vavr/SeqTypes.js";
import { Location } from "./board/Location.js";

/**
 * Minimal structural view of the W3C DOM, satisfied by both the browser's
 * native `DOMParser`/`Element` and the `@xmldom/xmldom` package used in tests.
 * Keeping our own interface lets the library stay `lib: ES2020` (no DOM lib
 * globals leaking into this WASM/browser-neutral engine).
 */
export interface XmlNode {
  readonly nodeType: number; // ELEMENT_NODE === 1
  readonly nodeName: string;
  readonly nodeValue: string | null;
  readonly textContent: string | null;
  readonly firstChild: XmlNode | null;
  readonly childNodes: XmlNodeList;
}

export interface XmlElement extends XmlNode {
  getAttribute(name: string): string; // "" when absent (DOM semantics)
  hasAttribute(name: string): boolean;
  getElementsByTagName(tag: string): XmlNodeList;
}

export interface XmlNodeList {
  readonly length: number;
  item(index: number): XmlNode | null;
}

export interface XmlDocument {
  readonly documentElement: XmlElement;
}

export interface XmlDOMParser {
  parseFromString(source: string, mimeType: string): XmlDocument;
}

const ELEMENT_NODE = 1;

/** Injectable DOMParser factory (browser global by default; tests set xmldom). */
let domParserFactory: (() => XmlDOMParser) | null = (() => {
  const g = globalThis as { DOMParser?: new () => XmlDOMParser };
  return g.DOMParser ? () => new g.DOMParser!() : null;
})();

export function setDomParserFactory(factory: () => XmlDOMParser): void {
  domParserFactory = factory;
}

export function parseDocument(source: string, parser?: XmlDOMParser): XmlDocument {
  const p = parser ?? (domParserFactory ? domParserFactory() : null);
  if (!p) {
    throw new Error(
      "No XML parser available. Call setDomParserFactory() or pass a parser (browser: DOMParser, Node: @xmldom/xmldom).",
    );
  }
  return p.parseFromString(source, "text/xml");
}

function nodeListToArray(nl: XmlNodeList): XmlNode[] {
  const out: XmlNode[] = [];
  for (let i = 0; i < nl.length; i++) {
    const n = nl.item(i);
    if (n !== null) out.push(n);
  }
  return out;
}

export function nodeStream(nl: XmlNodeList): Stream<XmlNode> {
  return Stream.ofAll(nodeListToArray(nl));
}

export function elementStream(nl: XmlNodeList): Stream<XmlElement> {
  return Stream.ofAll(
    nodeListToArray(nl).filter((n) => n.nodeType === ELEMENT_NODE) as XmlElement[],
  );
}

export function getChildElementStream(el: XmlElement): Stream<XmlElement> {
  return elementStream(el.childNodes);
}

export function getElementStreamByTagName(el: XmlElement, tagName: string): Seq<XmlElement> {
  return getChildElementStream(el).filter((e) => e.nodeName === tagName);
}

export function getElementByTagName(parent: XmlElement, childName: string): XmlElement | null {
  const nl = parent.getElementsByTagName(childName);
  if (nl.length === 0) return null;
  return nl.item(nl.length - 1) as XmlElement;
}

export function contentAsLocations(e: XmlElement): Stream<Location> {
  const tokens = (e.firstChild!.nodeValue ?? "").trim().split(/\s+/);
  return Stream.ofAll(tokens.map((s) => Location.valueOf(s)));
}

export function attrAsLocations(e: XmlElement, attr: string): Stream<Location> {
  const tokens = e.getAttribute(attr).trim().split(/\s+/);
  return Stream.ofAll(tokens.map((s) => Location.valueOf(s)));
}

export function attrAsLocation(e: XmlElement, attr: string): Location {
  const tokens = e.getAttribute(attr).trim().split(/\s+/);
  if (tokens.length !== 1) {
    throw new Error("Invalid number of locations. " + e.getAttribute(attr));
  }
  return Location.valueOf(tokens[0]);
}

export function attributeBoolValue(e: XmlElement, attr: string): boolean {
  if (!e.hasAttribute(attr)) return false;
  const val = e.getAttribute(attr);
  if (val === "true") return true;
  if (val !== "false") {
    throw new Error("only true/false value is allowed for boolean attribute");
  }
  return false;
}

export function attributeIntValue(e: XmlElement, attr: string, defaultValue: number | null = null): number | null {
  if (!e.hasAttribute(attr)) {
    return defaultValue;
  }
  const v = e.getAttribute(attr);
  if (v === "yes" || v === "true") {
    return 1;
  }
  return parseInt(v, 10);
}

export function attributeStringValue(e: XmlElement, attr: string, defaultValue: string | null = null): string | null {
  if (!e.hasAttribute(attr)) {
    return defaultValue;
  }
  return e.getAttribute(attr);
}
