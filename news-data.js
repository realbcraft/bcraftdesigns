/* ==========================================================
   news-data.js : the Bcraft Designs news posts
   Loaded by news.html (full page) and index.html (the "Latest news"
   strip and the "Most recent X posts" section), so you only ever edit
   posts in this one file.
   ========================================================== */

/* ==========================================================
   NEWS POSTS  <-- this is the only place you edit to publish news
   ----------------------------------------------------------
   TO ADD A POST: copy one { ... } block below, paste it inside the
   list, and change the values. Order in the list does not matter:
   the page sorts everything newest first by "date".

     id        unique, lowercase, no spaces (used in the post's link)
     date      "2026-10" (month only) or "2026-10-20" (exact day).
               Use exact days when two posts share a month, so the
               order is right (a month-only date counts as the 1st).
     category  Announcements, Promotions or Updates
     title     the headline
     summary   one or two sentences shown on the card and in the post
     content   optional. More text for the post, a list of blocks:
                 "Plain text"                 a paragraph
                 { heading: "Subheading" }    a subheading
                 { list: ["One", "Two"] }     a bulleted list
               Leave it out for a one-sentence post.
     image     optional thumbnail, full path including the images/ folder
               (best at 1280 x 720 px). Also shown at the top of the post
               when it is opened.
               Leave it out and the post shows the Bcraft logo template tile.
               A missing file falls back to the same tile.
     imageAlt  optional description of the image for screen readers
     imageSize optional. The image's resolution as "width x height", e.g. "1280x720"
               (default 1280x720). Sets the thumbnail's shape for this post only.
     featured  optional. true = shown large at the top of "All".
               If no post is marked, the newest one is featured.
     badge     optional label on the post, e.g. "Draft".
     cta       optional button: { text: "Button text", href: "page.html" }

   IMAGE FILE NAMES: save each thumbnail in the images/ folder with
   exactly the name written in its "image" line below:
     images/news-website-launch-01.png    "Our brand new website is live"
     images/halloween-popup-01.png        "20% Off Everything Halloween Sale"
   For a new post, follow the same pattern: images/news-<topic>-01.png

   Anything you still need to fill in can be written as [[LIKE THIS]]
   and it is highlighted orange so it can't be missed.
   To remove a post, delete its block (or comment it out).
   ========================================================== */
const NEWS_POSTS = [
  {
    id: "new-website-launch",
    date: "2026-10-20",
    category: "Announcements",
    title: "Our brand new website is live",
    summary: "Our work, pricing, client reviews and contact details are all in one place now. Better than ever!",
    featured: true,
    image: "images/news-website-launch-01.png",
    imageAlt: "The new Bcraft Designs website",
    content: [
      "Take a look around on my new website, and if you'd like something made, you can commission us straight from the site."
    ]
  },
  {
    id: "halloween-sale-2026",
    date: "2026-10",
    category: "Promotions",
    title: "20% Off Everything Halloween Sale",
    imageSize: "1430x731",
    image: "images/halloween-popup-01.png",
    imageAlt: "Halloween sale: 20% off everything",
    summary: "Everything is 20% off during our Halloween sale, which runs until October 31st.",
    cta: { text: "Commission Me", href: "pricing.html" }
    }
  
];

/* ==========================================================
   X POSTS  <-- the "Most recent X posts" sections (news page + homepage)
   ----------------------------------------------------------
   Each post is drawn as a small custom card (same look as the X card
   in "Your Perks"). Nothing is loaded from X, so the pages stay fast,
   and "View on X" opens the real post.

   TO ADD A POST: copy one { ... } block, paste it into the list (newest
   first) and change the values. 3 or 4 posts is plenty.

     url       the real post's address (copied from the browser bar on X)
     date      "2026-10-17"  (shown on the card)
     image     optional picture, full path including images/
               (best at 1280 x 720 px, 16:9)
     imageAlt  optional description of the picture for screen readers
     text      the post text, one entry per line/paragraph. Web addresses
               inside it become links on their own.
     tags      optional hashtags WITHOUT the # sign
     name      optional, the name shown (default: X_NAME below)
     verified  optional, false hides the verified badge (default: true)

   A plain address on its own line (just "https://x.com/...") still works
   and gives the old click-to-load card, but the custom card is faster.
   To remove a post, delete its block. With an empty list the sections
   show an "Open @realbcraft on X" card instead.
   To keep the section "recent", swap the oldest post for a new one now
   and then.

   IMAGE FILE: images/x-post-thumbnail-01.webp
   ========================================================== */
const X_HANDLE = "realbcraft";
const X_NAME = "Bcraft | bcraftdesigns.com";
const X_POSTS = [
  {
    url: "https://x.com/realbcraft/status/2111673604496670964",
    date: "2026-10-18",
    image: "images/x-post-thumbnail-01.webp",
    text: [
      "👀New Profile Picture!",
      "🌐https://bcraftdesigns.com",
      "💙Like & 🔄Repost if you like this one"
    ],
    tags: ["robloxart", "robloxGFX", "pfp"]
  },
  {
    url: "https://x.com/realbcraft/status/2109093911549681764",
    date: "2026-10-11",
    image: "images/x-post-thumbnail-02.png",
        text: [
      "The new BcraftDesigns Website is set to launch on October 20th.",
      "🎃 Until then, enjoy the Halloween Promotion!",
    ],
    tags: ["roblox", "robloxart", "website", "RobloxGFX"]
  }
];

/* Reads "2026-10" or "2026-10-20". Used by both pages; no need to edit. */
const NEWS_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function parseNewsDate(value) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(value || "").trim());
  if (!m) return null;
  const month = Number(m[2]);
  const day = m[3] ? Number(m[3]) : 0;
  if (month < 1 || month > 12 || day > 31) return null;
  return {
    iso: m[0],
    label: day ? NEWS_MONTHS[month - 1] + " " + day + ", " + m[1] : NEWS_MONTHS[month - 1] + " " + m[1],
    time: Date.UTC(Number(m[1]), month - 1, day || 1)
  };
}