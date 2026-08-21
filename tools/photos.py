#!/usr/bin/env python3
"""Find, licence-check and encode dish photographs from Wikimedia Commons.

    python3 tools/photos.py search "khao soi curry noodle"
    python3 tools/photos.py fetch "Som tam in Yasothon.jpg"
    python3 tools/photos.py encode tools/.out/photos/som-tam-in-yasothon.jpg
    python3 tools/photos.py sheet          # contact sheet of everything fetched

Why Commons and not a stock site: every file carries a machine-readable licence
and author, so the footer credit can be accurate. Prefer CC0 / CC BY / CC BY-SA
and record what `fetch` prints — that string is what belongs in the credits.

Always LOOK at a photo before using it. `sheet` builds an HTML contact sheet;
screenshot it with tools/shots.mjs or open it. Several plausible-sounding files
turned out to be the wrong dish, or mostly tablecloth.

Commons rate-limits hard, so requests are paced and retried on 429.
"""

import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "saep-portfolio/1.0 (personal portfolio project)"}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "tools", ".out", "photos")
SHORT_SIDE = 560          # enough for a 238px plate at 2x
QUALITY = 70


def _get(url, tries=5):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            return urllib.request.urlopen(req, timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                wait = 4 * (attempt + 1)
                print(f"   rate-limited, waiting {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            raise
    raise SystemExit("gave up on " + url)


def _api(**params):
    params.setdefault("action", "query")
    params.setdefault("format", "json")
    return json.loads(_get(API + "?" + urllib.parse.urlencode(params)))


def _credit(info):
    meta = info.get("extmetadata", {})
    artist = re.sub(r"<[^>]+>", "", (meta.get("Artist") or {}).get("value", "")).strip()
    licence = (meta.get("LicenseShortName") or {}).get("value", "?")
    return artist[:70] or "unknown", licence


def search(query, limit=10):
    d = _api(generator="search", gsrsearch=query + " filetype:bitmap",
             gsrnamespace="6", gsrlimit=str(limit),
             prop="imageinfo", iiprop="url|size|extmetadata", iiurlwidth="900")
    pages = (d.get("query") or {}).get("pages") or {}
    if not pages:
        print("no results")
        return
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        artist, licence = _credit(info)
        print(f"[{licence:<14}] {info.get('width')}x{info.get('height'):<6} "
              f"{artist[:26]:<26} {page['title'][5:]}")


def fetch(title):
    os.makedirs(OUT, exist_ok=True)
    d = _api(titles="File:" + title, prop="imageinfo",
             iiprop="url|extmetadata", iiurlwidth="900")
    page = list(d["query"]["pages"].values())[0]
    if "imageinfo" not in page:
        raise SystemExit("no such file on Commons: " + title)
    info = page["imageinfo"][0]
    artist, licence = _credit(info)
    slug = re.sub(r"[^a-z0-9]+", "-", os.path.splitext(title)[0].lower()).strip("-")
    path = os.path.join(OUT, slug + ".jpg")
    time.sleep(1.3)
    with open(path, "wb") as f:
        f.write(_get(info["thumburl"]))
    creditfile = os.path.join(OUT, "credits.json")
    credits = json.load(open(creditfile)) if os.path.exists(creditfile) else {}
    credits[slug] = {"title": title, "artist": artist, "license": licence,
                     "page": "https://commons.wikimedia.org/wiki/"
                             + urllib.parse.quote("File:" + title.replace(" ", "_"))}
    json.dump(credits, open(creditfile, "w"), ensure_ascii=False, indent=1)
    print(f"{path}\n  CREDIT: {artist} ({licence})")


def encode(path):
    """Resize so the short side is SHORT_SIDE, encode WebP, print a data URI."""
    dims = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
                          capture_output=True, text=True).stdout
    w = int([l for l in dims.splitlines() if "pixelWidth" in l][0].split(":")[1])
    h = int([l for l in dims.splitlines() if "pixelHeight" in l][0].split(":")[1])
    flag = ["--resampleHeight", str(SHORT_SIDE)] if h <= w \
        else ["--resampleWidth", str(SHORT_SIDE)]
    stem = os.path.splitext(path)[0]
    subprocess.run(["sips", "-s", "format", "png", path, "--out", stem + ".png"] + flag,
                   capture_output=True)
    webp = stem + ".webp"
    subprocess.run(["cwebp", "-q", str(QUALITY), "-m", "6", "-quiet",
                    stem + ".png", "-o", webp], capture_output=True)
    raw = open(webp, "rb").read()
    uri = "data:image/webp;base64," + base64.b64encode(raw).decode()
    open(stem + ".datauri.txt", "w").write(uri)
    print(f"{len(raw)//1024}KB webp -> {stem}.datauri.txt  ({len(uri)//1024}KB as a URI)")
    print("paste it into the matching .dish-plate img src in index.html")


def sheet():
    creditfile = os.path.join(OUT, "credits.json")
    credits = json.load(open(creditfile)) if os.path.exists(creditfile) else {}
    cells = []
    for slug in sorted(credits):
        c = credits[slug]
        cells.append(f'<figure><img src="{slug}.jpg" alt="">'
                     f'<figcaption>{slug} — {c["license"]} — {c["artist"]}</figcaption></figure>')
    path = os.path.join(OUT, "sheet.html")
    open(path, "w", encoding="utf-8").write(
        "<!DOCTYPE html><meta charset=utf-8><style>"
        "body{background:#111;color:#eee;font:12px ui-monospace,monospace;margin:0;padding:10px}"
        ".g{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}"
        "figure{margin:0}img{width:100%;height:250px;object-fit:cover;display:block;background:#222}"
        "figcaption{padding:4px 0;color:#ffb}"
        "</style><div class=g>" + "".join(cells) + "</div>")
    print(path + f"  ({len(cells)} photos) — screenshot or open it, then choose")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    cmd, args = sys.argv[1], sys.argv[2:]
    {"search": search, "fetch": fetch, "encode": encode, "sheet": sheet}[cmd](*args)
