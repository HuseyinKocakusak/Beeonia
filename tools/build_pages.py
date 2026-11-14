"""Build the sub-pages in Turkish and English.

Each page's own content lives in pages/<name>.html (only what goes inside
<main>, with data-tr / data-en on every text element). Everything shared is
taken from index.html so it never drifts: the header, mobile menu, product
pop-up, basket drawer and footer, plus the product cards, gallery photos,
team cards and literature filters that some pages show again.

Called from tools/build_en.py; not meant to be run on its own.
"""

import html
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://beeonia.com"

# name -> Turkish path, English path, titles and descriptions
PAGES = {
    "urunler": {
        "tr": "/urunler/", "en": "/en/products/",
        "title_tr": "Ürünler | BEEONIA - Analizli Çam Balı, Çiçek Balı, Petek Bal, Polen, Propolis",
        "title_en": "Products | BEEONIA - Lab-Analyzed Pine Honey, Flower Honey, Comb Honey, Pollen, Propolis",
        "desc_tr": "Beeonia ürünleri: çam balı, polifloral çiçek balı, petek bal, polen ve propolis. Hasat tarihleri, gramaj ve fiyatlar, laboratuvar analiz raporları ve WhatsApp ile talep.",
        "desc_en": "Beeonia products: pine honey, polyfloral honey, comb honey, bee pollen and propolis. Harvest dates, sizes and prices, laboratory reports and ordering via WhatsApp.",
    },
    "galeri": {
        "tr": "/galeri.html", "en": "/en/gallery.html",
        "title_tr": "Galeri | BEEONIA - Arılıktan Kareler",
        "title_en": "Gallery | BEEONIA - Scenes from the Apiary",
        "desc_tr": "Beeonia arılıklarından fotoğraflar: Yamanlar Dağı, Selendi ve Menderes'te hasat, koloni bakımı ve gezginci arıcılık.",
        "desc_en": "Photos from the Beeonia apiaries: harvests, colony care and migratory beekeeping on Yamanlar Mountain, in Selendi and Menderes.",
    },
    "hakkimizda": {
        "tr": "/hakkimizda/", "en": "/en/about/",
        "title_tr": "Hakkımızda | BEEONIA - Vizyon, Misyon ve Prensiplerimiz",
        "title_en": "About | BEEONIA - Our Vision, Mission and Principles",
        "desc_tr": "Beeonia'nın vizyonu, misyonu ve prensipleri; grafikler, şemalar ve bilimsel kaynaklarla. Arı refahı, izlenebilir üretim ve laboratuvar analizi.",
        "desc_en": "Beeonia's vision, mission and principles, shown with charts, diagrams and scientific references. Bee welfare, traceable production and laboratory analysis.",
    },
    "iletisim": {
        "tr": "/iletisim/", "en": "/en/contact/",
        "title_tr": "İletişim | BEEONIA - Bize Ulaşın",
        "title_en": "Contact | BEEONIA - Get in Touch",
        "desc_tr": "Beeonia ile iletişim: WhatsApp +90 544 460 18 22, info@beeonia.com, Instagram ve ekibimiz. İzmir, Türkiye.",
        "desc_en": "Contact Beeonia: WhatsApp +90 544 460 18 22, info@beeonia.com, Instagram and our team. Izmir, Türkiye.",
    },
    "literatur": {
        "tr": "/literatur/", "en": "/en/literature/",
        "title_tr": "Literatür | BEEONIA - Arı Ürünleri Üzerine Bilimsel Makaleler",
        "title_en": "Literature | BEEONIA - Scientific Articles on Bee Products",
        "desc_tr": "Bal, propolis, polen ve arı sütü üzerine hakemli bilimsel makalelerin Türkçe özetleri; kategoriye göre filtreleyin veya arayın.",
        "desc_en": "Summaries of peer-reviewed research on honey, propolis, bee pollen and royal jelly; filter by category or search.",
    },
}

LINKS = [("/", "/en/")] + [(p["tr"], p["en"]) for p in PAGES.values()]

MONTHS = {"January": "Ocak", "February": "Şubat", "March": "Mart", "April": "Nisan",
          "May": "Mayıs", "June": "Haziran", "July": "Temmuz", "August": "Ağustos",
          "September": "Eylül", "October": "Ekim", "November": "Kasım", "December": "Aralık"}


def esc(s, quote=True):
    return html.escape(s or "", quote=quote)


def to_en_links(doc):
    """Point internal links of an English page at the English pages."""
    def swap(m):
        url = m.group(2)
        for tr, en in LINKS:
            if url == tr or (tr == "/" and url.startswith("/#")):
                return m.group(1) + en + url[len(tr):] + m.group(3)
        return m.group(0)
    return re.sub(r'(<a\b[^>]*?\bhref=")(/[^"]*)(")', swap, doc)


def find_all(node, cls):
    out = []
    for kid in node.children:
        if cls in (kid.attrs.get("class") or "").split():
            out.append(kid)
        else:
            out.extend(find_all(kid, cls))
    return out


def find_id(node, id_):
    for kid in node.children:
        if kid.attrs.get("id") == id_:
            return kid
        hit = find_id(kid, id_)
        if hit:
            return hit
    return None


def text_of(src, node):
    return html.unescape(re.sub(r"<[^>]+>", "", src[node.start_end:node.end_start])).strip()


def products_grid(src, tree):
    cards = []
    for c in find_all(tree.root, "product-card"):
        a = c.attrs
        img = find_all(c, "product-image")[0].children[0].attrs
        h3 = [k for k in find_all(c, "product-info")[0].children if k.tag == "h3"][0].attrs
        data = "".join(f' {k}="{esc(v)}"' for k, v in a.items() if k.startswith("data-"))
        try:
            import json
            variants = json.loads(a.get("data-variants") or "[]")
        except ValueError:
            variants = []
        if not variants:
            variants = [{"weight": a.get("data-weight"), "price": a.get("data-price")}]
        prices = "".join(
            f'<span class="shop-price"><span>{esc(v.get("weight"), False)}</span><strong>{esc(v.get("price"), False)}</strong></span>'
            for v in variants if v.get("weight") or v.get("price"))
        series = ""
        if a.get("data-series-tr"):
            series = (f'<div class="product-status collection" data-tr="{esc(a["data-series-tr"])}" '
                      f'data-en="{esc(a.get("data-series-en"))}">{esc(a["data-series-tr"], False)}</div>')
        lab = ""
        if a.get("data-analyses"):
            lab = ('<span class="shop-lab" data-tr="Analiz raporu mevcut" data-en="Lab report available">'
                   'Analiz raporu mevcut</span>')
        cards.append(f'''
          <article class="product-card shop-card"{data}>
            <div class="product-image">
              <img src="{esc(img.get("src"))}" alt="{esc(img.get("alt"))}" loading="lazy" />
              {series}
            </div>
            <div class="product-info shop-card-body">
              <p class="shop-card-origin" data-tr="{esc(a.get("data-origin-tr"))}" data-en="{esc(a.get("data-origin-en"))}">{esc(a.get("data-origin-tr"), False)}</p>
              <h3 data-tr="{esc(h3.get("data-tr"))}" data-en="{esc(h3.get("data-en"))}">{esc(h3.get("data-tr"), False)}</h3>
              <p class="shop-card-desc" data-tr="{esc(a.get("data-description-tr"))}" data-en="{esc(a.get("data-description-en"))}">{esc(a.get("data-description-tr"), False)}</p>
              {lab}
              <div class="shop-card-prices">{prices}</div>
              <span class="shop-card-cta" data-tr="Detaylar ve talep" data-en="Details and request">Detaylar ve talep</span>
            </div>
          </article>''')
    return '<div class="shop-grid">' + "".join(cards) + "\n        </div>"


def analyses_list(src, tree):
    import json
    rows = []
    for c in find_all(tree.root, "product-card"):
        if not c.attrs.get("data-analyses"):
            continue
        h3 = [k for k in find_all(c, "product-info")[0].children if k.tag == "h3"][0].attrs
        for an in json.loads(c.attrs["data-analyses"]):
            rows.append(
                f'<a class="report-link" href="{esc(an["file"])}" target="_blank" rel="noopener">'
                f'<span class="report-product" data-tr="{esc(h3.get("data-tr"))}" data-en="{esc(h3.get("data-en"))}">{esc(h3.get("data-tr"), False)}</span>'
                f'<span class="report-name" data-tr="{esc(an.get("labelTr"))}" data-en="{esc(an.get("labelEn"))}">{esc(an.get("labelTr"), False)}</span>'
                f'<span class="report-type">PDF</span></a>')
    return '<div class="report-list">' + "".join(rows) + "</div>"


def gallery_grid(src, tree):
    figs = []
    for it in find_all(tree.root, "polaroid-item"):
        img = find_all(it, "polaroid-photo")[0].children[0].attrs
        date_node = find_all(it, "polaroid-date")[0]
        date_en = text_of(src, date_node)
        if "data-tr" in date_node.attrs:
            # Items with their own translations (added in the 2026 season)
            date_tr, date_en = date_node.attrs["data-tr"], date_node.attrs["data-en"]
            loc = text_of(src, find_all(it, "polaroid-location")[0])
            figs.append(f'''
          <figure class="gallery-item">
            <button type="button" class="gallery-open" aria-label="Fotoğrafı büyüt">
              <img src="{esc(img.get("src"))}" alt="{esc(img.get("alt"))}" loading="lazy" />
            </button>
            <figcaption>
              <span class="gallery-date" data-tr="{esc(date_tr)}" data-en="{esc(date_en)}">{esc(date_tr, False)}</span>
              <span class="gallery-loc">{esc(loc, False)}</span>
            </figcaption>
          </figure>''')
            continue
        loc = text_of(src, find_all(it, "polaroid-location")[0])
        m = re.match(r"(\w+)\s+(\d+)[.,]\s*(\d{4})", date_en)
        if m and m.group(1) in MONTHS:
            date_en = f"{m.group(1)} {int(m.group(2))}, {m.group(3)}"
            date_tr = f"{int(m.group(2))} {MONTHS[m.group(1)]} {m.group(3)}"
        else:
            date_tr = date_en
        loc_tr = loc.replace("Izmir", "İzmir")
        figs.append(f'''
          <figure class="gallery-item">
            <button type="button" class="gallery-open" aria-label="Fotoğrafı büyüt">
              <img src="{esc(img.get("src"))}" alt="{esc(img.get("alt"))}" loading="lazy" />
            </button>
            <figcaption>
              <span class="gallery-date" data-tr="{esc(date_tr)}" data-en="{esc(date_en)}">{esc(date_tr, False)}</span>
              <span class="gallery-loc" data-tr="{esc(loc_tr)}" data-en="{esc(loc)}">{esc(loc_tr, False)}</span>
            </figcaption>
          </figure>''')
    return '<div class="gallery-grid" id="galleryGrid">' + "".join(figs) + "\n        </div>"


def raw(src, node):
    return src[node.start:node.end]


def head(index_src, name, lang):
    p = PAGES[name]
    url = SITE + p[lang]
    gtag = re.search(r"<!-- Google tag.*?</script>\s*<script>.*?</script>", index_src, re.S).group(0)
    assets = re.search(r"<!-- Favicons.*?(?=\s*</head>)", index_src, re.S).group(0)
    assets = assets.replace('rel="stylesheet" href="/css/custom_20260120_0435.css" />',
                            'rel="stylesheet" href="/css/custom_20260120_0435.css" />\n'
                            '    <link rel="stylesheet" href="/css/pages.css" />')
    redirect = ""
    if lang == "tr":
        redirect = f'''
    <script>
      try {{
        if (localStorage.getItem("beeonia-lang") === "en") {{
          location.replace("{p["en"]}" + location.hash);
        }}
      }} catch (e) {{}}
    </script>'''
    locale = ("tr_TR", "en_US") if lang == "tr" else ("en_US", "tr_TR")
    title, desc = esc(p["title_" + lang]), esc(p["desc_" + lang])
    return f'''<!doctype html>
<!-- Generated by tools/build_en.py from pages/{name}.html and index.html. Do not edit by hand. -->
<html lang="{lang}">
  <head>
    <meta charset="UTF-8" />{redirect}
    {gtag}
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content="{desc}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="{url}" />
    <link rel="alternate" hreflang="tr" href="{SITE}{p["tr"]}" />
    <link rel="alternate" hreflang="en" href="{SITE}{p["en"]}" />
    <link rel="alternate" hreflang="x-default" href="{SITE}{p["tr"]}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{url}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{desc}" />
    <meta property="og:image" content="{SITE}/images/Beeonia.png" />
    <meta property="og:site_name" content="Beeonia" />
    <meta property="og:locale" content="{locale[0]}" />
    <meta property="og:locale:alternate" content="{locale[1]}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{desc}" />
    <meta name="twitter:image" content="{SITE}/images/Beeonia.png" />
    {assets}
  </head>
'''


def build(index_src, localize, Tree):
    tree = Tree(index_src)
    tree.feed(index_src)
    tree.close()

    top = index_src[index_src.index("<body>") + len("<body>"):index_src.index("    <!-- Main Content -->")]
    bottom = index_src[index_src.index("    <!-- Footer -->"):index_src.index("</footer>") + len("</footer>")]
    includes = {
        "products-grid": lambda: products_grid(index_src, tree),
        "analyses-list": lambda: analyses_list(index_src, tree),
        "gallery-grid": lambda: gallery_grid(index_src, tree),
        "team-grid": lambda: raw(index_src, find_all(tree.root, "team-grid")[0]),
        "science-categories": lambda: raw(index_src, find_id(tree.root, "scienceCategories")),
    }

    for name, p in PAGES.items():
        with open(os.path.join(ROOT, "pages", name + ".html"), encoding="utf-8") as f:
            content = f.read()
        content = re.sub(r"<!-- include:([\w-]+) -->", lambda m: includes[m.group(1)](), content)
        body = (f'  <body class="subpage page-{name}">{top}'
                f'    <main class="page-main">\n{content}\n    </main>\n\n{bottom}\n'
                '    <script src="/script_20260120_0435.js"></script>\n'
                '    <script src="/js/pages.js"></script>\n  </body>\n</html>\n')
        for lang in ("tr", "en"):
            doc = localize(head(index_src, name, lang) + body, lang)
            if lang == "en":
                doc = to_en_links(doc)
            rel = p[lang].strip("/")
            out = os.path.join(ROOT, rel) if rel.endswith(".html") else os.path.join(ROOT, rel, "index.html")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, "w", encoding="utf-8") as f:
                f.write(doc)
    print(f"{len(PAGES)} sub-pages written in tr and en")
