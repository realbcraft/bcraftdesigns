// Reads x-links.txt, fetches each NEW post (text, date, image) once,
// saves the image to images/x-<id>.webp and rewrites the X_POSTS block in news-data.js.
// Visitors never contact X: everything ends up as plain static files.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const MAX_POSTS = 2;                       // how many posts to keep on the site
const LINKS_FILE = "x-links.txt";
const DATA_FILE = "news-data.js";
const CACHE_FILE = "x-posts-cache.json";   // remembers fetched posts so each is fetched only once
const IMG_DIR = "images";
const START = "/* X-POSTS:START";
const END = "/* X-POSTS:END */";

const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) : {};
let failed = false;

const links = fs.readFileSync(LINKS_FILE, "utf8").split(/\r?\n/)
  .map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

function parseLink(url) {
  const m = /(?:x|twitter)\.com\/([^/?#]+)\/status\/(\d+)/i.exec(url);
  return m ? { user: m[1], id: m[2] } : null;
}

// Trailing lines that are only hashtags become tags (shown as tags on the card).
function splitTags(raw) {
  const lines = raw.replace(/\r/g, "").split("\n").map((l) => l.trimEnd());
  const tags = [];
  while (lines.length) {
    const last = lines[lines.length - 1].trim();
    if (last === "") { lines.pop(); continue; }
    if (/^(#\w+\s*)+$/.test(last)) {
      tags.unshift(...last.match(/#\w+/g).map((t) => t.slice(1)));
      lines.pop();
    } else break;
  }
  return { text: lines.map((l) => l.trim()).filter(Boolean), tags };
}

async function fetchPost({ user, id }) {
  const res = await fetch(`https://api.fxtwitter.com/${user}/status/${id}`, {
    headers: { "User-Agent": "bcraft-site-updater" },
  });
  if (!res.ok) throw new Error(`fxtwitter HTTP ${res.status}`);
  const t = (await res.json()).tweet;
  if (!t) throw new Error("no tweet in response");
  const photo = t.media?.photos?.[0]?.url
    || t.media?.videos?.[0]?.thumbnail_url
    || t.media?.all?.[0]?.thumbnail_url || t.media?.all?.[0]?.url;
  let image;
  if (photo) {
    const img = await fetch(photo);
    if (!img.ok) throw new Error(`image HTTP ${img.status}`);
    const buf = Buffer.from(await img.arrayBuffer());
    image = `${IMG_DIR}/x-${id}.webp`;
    fs.mkdirSync(IMG_DIR, { recursive: true });
    await sharp(buf).resize(1280, 720, { fit: "cover" }).webp({ quality: 80 }).toFile(image);
  }
  const { text, tags } = splitTags(t.text || "");
  const d = new Date(t.created_timestamp ? t.created_timestamp * 1000 : t.created_at);
  return { url: `https://x.com/${user}/status/${id}`, date: d.toISOString().slice(0, 10), image, text, tags };
}

for (const url of links) {
  const p = parseLink(url);
  if (!p) { console.warn("Skipping, not a post link:", url); failed = true; continue; }
  if (cache[p.id]) continue;
  try {
    cache[p.id] = await fetchPost(p);
    console.log("Fetched", p.id);
  } catch (e) {
    console.warn(`Could not fetch ${url}: ${e.message}`);
    failed = true;
  }
}

const posts = links.map(parseLink).filter(Boolean).map((p) => cache[p.id]).filter(Boolean)
  .sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_POSTS)
  .map((p) => { const o = { url: p.url, date: p.date }; if (p.image) o.image = p.image;
    o.text = p.text; if (p.tags.length) o.tags = p.tags; return o; });

// Keep the last good data if nothing could be built.
if (posts.length) {
  const src = fs.readFileSync(DATA_FILE, "utf8");
  const s = src.indexOf(START), e = src.indexOf(END);
  if (s < 0 || e < 0) throw new Error("X-POSTS markers not found in news-data.js");
  const startLineEnd = src.indexOf("*/", s) + 2;
  const block = "\nconst X_POSTS = " + JSON.stringify(posts, null, 2) + ";\n";
  fs.writeFileSync(DATA_FILE, src.slice(0, startLineEnd) + block + src.slice(e));
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  // Delete images of posts that are no longer shown
  const keep = new Set(posts.map((p) => p.image && path.basename(p.image)));
  for (const f of fs.existsSync(IMG_DIR) ? fs.readdirSync(IMG_DIR) : [])
    if (/^x-\d+\.webp$/.test(f) && !keep.has(f)) fs.unlinkSync(path.join(IMG_DIR, f));
}
if (failed) process.exitCode = 1;