#!/usr/bin/env python3
"""Generate the English page (en/index.html) from the Turkish source (index.html).

index.html is the single source of truth. Every element that carries both
data-tr and data-en gets its text written out in the page's language, so the
HTML that search engines download is already Turkish at "/" and English at
"/en/". The <head> of the English page gets its own title, descriptions,
canonical URL and locale.

Run after every change to index.html:

    python3 tools/build_en.py

The script rewrites index.html in place (normalising its text to Turkish)
and overwrites en/index.html. It is idempotent.
"""

import html
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "index.html")
EN_OUT = os.path.join(ROOT, "en", "index.html")

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}

# Turkish <head> text -> English replacement. Each key must appear exactly once.
HEAD_EN = [
    ('<html lang="tr">', '<html lang="en">'),
    ("<title>\n      BEEONIA | Premium Arı Ürünleri - Çam Balı, Propolis, Polen",
     "<title>\n      BEEONIA | Premium Bee Products - Pine Honey, Propolis, Bee Pollen"),
    ('content="Beeonia - Ege\'nin premium arı ürünleri. Çam balı, çiçek balı, petek bal, propolis ve polen. Bilimsel araştırmalarla desteklenen, izlenebilir üretim süreçleriyle arıcılık ürünleri. İzmir, Türkiye."',
     'content="Beeonia - premium bee products from the Aegean. Pine honey, flower honey, comb honey, propolis and bee pollen, backed by scientific research and traceable production. Izmir, Türkiye."'),
    ('<link rel="canonical" href="https://beeonia.com/" />',
     '<link rel="canonical" href="https://beeonia.com/en/" />'),
    ('<meta property="og:url" content="https://beeonia.com/" />',
     '<meta property="og:url" content="https://beeonia.com/en/" />'),
    ('property="og:title"\n      content="BEEONIA | Premium Arı Ürünleri - Çam Balı, Propolis, Polen"',
     'property="og:title"\n      content="BEEONIA | Premium Bee Products - Pine Honey, Propolis, Bee Pollen"'),
    ('property="og:description"\n      content="Ege\'nin doğal arı ürünleri. Premium çam balı, çiçek balı, propolis ve polen. Bilimsel araştırmalarla desteklenen, doğadan sofraya saf arıcılık ürünleri."',
     'property="og:description"\n      content="Natural bee products from the Aegean. Premium pine honey, flower honey, propolis and bee pollen, backed by science and laboratory analyses."'),
    ('<meta property="og:locale" content="tr_TR" />\n    <meta property="og:locale:alternate" content="en_US" />',
     '<meta property="og:locale" content="en_US" />\n    <meta property="og:locale:alternate" content="tr_TR" />'),
    ('name="twitter:title"\n      content="BEEONIA | Premium Arı Ürünleri - Çam Balı, Propolis, Polen"',
     'name="twitter:title"\n      content="BEEONIA | Premium Bee Products - Pine Honey, Propolis, Bee Pollen"'),
    ('name="twitter:description"\n      content="Ege\'nin doğal arı ürünleri. Premium çam balı, çiçek balı, propolis ve polen. Doğadan sofraya saf arıcılık ürünleri."',
     'name="twitter:description"\n      content="Natural bee products from the Aegean. Premium pine honey, flower honey, propolis and bee pollen. Pure beekeeping products from nature to your table."'),
]

# The "remember English" redirect only belongs on the Turkish page.
REDIRECT_BLOCK = re.compile(
    r"\n?[ \t]*<!-- lang-redirect:start -->.*?<!-- lang-redirect:end -->", re.S)


class Node:
    def __init__(self, tag, attrs, start, start_end):
        self.tag = tag
        self.attrs = dict(attrs)
        self.start = start          # offset of "<"
        self.start_end = start_end  # offset just after the start tag
        self.end_start = None       # offset of "</tag>"
        self.end = None             # offset just after "</tag>"
        self.children = []

    @property
    def localizable(self):
        return "data-tr" in self.attrs and "data-en" in self.attrs


class Tree(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.text = text
        self.line_offsets = [0]
        for line in text.split("\n"):
            self.line_offsets.append(self.line_offsets[-1] + len(line) + 1)
        self.root = Node("#root", [], 0, 0)
        self.stack = [self.root]

    def _offset(self):
        line, col = self.getpos()
        return self.line_offsets[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self._offset()
        node = Node(tag, attrs, start, start + len(self.get_starttag_text()))
        self.stack[-1].children.append(node)
        if tag in VOID:
            node.end_start = node.end = node.start_end
        else:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        start = self._offset()
        node = Node(tag, attrs, start, start + len(self.get_starttag_text()))
        node.end_start = node.end = node.start_end
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        start = self._offset()
        # Pop to the matching element (the source is well-formed).
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                node = self.stack[i]
                node.end_start = start
                node.end = self.text.index(">", start) + 1
                del self.stack[i:]
                return
        raise ValueError(f"Unmatched </{tag}> at {self.getpos()}")


def esc(s):
    return html.escape(s, quote=False)


def visible_text(src, node):
    """Rough textContent of an element without data attributes."""
    inner = src[node.start_end:node.end_start]
    return html.unescape(re.sub(r"<[^>]+>", "", inner))


def render_inner(src, node, lang):
    """New inner HTML of a localizable element; mirrors setLocalizedText()."""
    text = node.attrs[f"data-{lang}"]
    if not node.children:
        return esc(text)
    parts, rest = [], text
    for kid in node.children:
        raw_open = src[kid.start:kid.start_end]
        raw_close = src[kid.end_start:kid.end]
        if kid.tag == "svg":
            parts.append(src[kid.start:kid.end])
            continue
        kid_text = kid.attrs.get(f"data-{lang}") if kid.localizable else visible_text(src, kid)
        idx = rest.find(kid_text) if kid_text else -1
        if idx < 0:
            return esc(text)
        if idx > 0:
            parts.append(esc(rest[:idx]))
        if kid.localizable:
            parts.append(raw_open + render_inner(src, kid, lang) + raw_close)
        else:
            parts.append(src[kid.start:kid.end])
        rest = rest[idx + len(kid_text):]
    if rest:
        parts.append(esc(rest))
    return "".join(parts)


def localize(src, lang):
    tree = Tree(src)
    tree.feed(src)
    tree.close()
    edits = []

    def walk(node):
        for kid in node.children:
            if kid.localizable:
                edits.append((kid.start_end, kid.end_start, render_inner(src, kid, lang)))
            else:
                walk(kid)

    walk(tree.root)
    out = src
    for start, end, new in sorted(edits, reverse=True):
        out = out[:start] + new + out[end:]
    return out


def main():
    with open(SRC, encoding="utf-8") as f:
        src = f.read()

    tr = localize(src, "tr")
    en = localize(tr, "en")

    for old, new in HEAD_EN:
        count = en.count(old)
        if count != 1:
            sys.exit(f"build_en: expected one match for head text, found {count}:\n{old}")
        en = en.replace(old, new)
    en, n = REDIRECT_BLOCK.subn("", en)
    if n != 1:
        sys.exit("build_en: lang-redirect block not found in index.html")

    with open(SRC, "w", encoding="utf-8") as f:
        f.write(tr)
    os.makedirs(os.path.dirname(EN_OUT), exist_ok=True)
    with open(EN_OUT, "w", encoding="utf-8") as f:
        f.write("<!-- Generated by tools/build_en.py from index.html. Do not edit by hand. -->\n" + en)
    print("index.html (tr) and en/index.html (en) written")


if __name__ == "__main__":
    main()
