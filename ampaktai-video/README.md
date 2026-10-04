# แอมปักใต้ — LINE ordering explainer video

A 55-second animated explainer (1920×1080, 30 fps, Thai) showing how a customer orders from the restaurant
**แอมปักใต้** through its LINE Official Account (@ampaktai). The full journey runs from adding the account as a
friend, through chatting with the admin, to delivery and cash on delivery (COD).

- **Video (16:9):** `ampaktai-line-order.mp4` (1920×1080)
- **Video (9:16, TikTok / Reels / Shorts):** `ampaktai-line-order-vertical.mp4` (1080×1920). Same timeline, soundtrack and text, re-laid out for portrait.
- **Source:** `index.html`. Every frame is a pure function of time (`seek(t)`), so the video renders deterministically.
  Open the file in a browser to watch a silent live preview. Add `?t=12.5` to the URL to freeze on a single moment, and `?v` to switch to the vertical layout.

## Scenes

| Time | Scene | Caption |
|---|---|---|
| 0–4 s | Intro: restaurant, logo, title, LINE + phone | หิวเมื่อไหร่ สั่งแอมปักใต้ผ่าน LINE ได้เลย! |
| 4–9 s | Customer taps เพิ่มเพื่อน → เพิ่มเพื่อนแล้ว ✓ → chat opens, camera zooms into the phone | STEP 1 |
| 9–15 s | Asks for the menu, admin types, 3 menu cards slide in | STEP 2 |
| 15–21.5 s | Customer types the order, items arrive one by one, admin asks for details | STEP 3 |
| 21.5–27 s | Name / 📍 address / 📞 phone / 💵 COD | STEP 4 |
| 27–33.5 s | Order summary card (310 บาท), quick-reply ยืนยันค่ะ ✅, ORDER CONFIRMED | STEP 5 |
| 33.5–39 s | Kitchen: ticket, wok cooking, packing into the branded bag, LINE notification and progress tracker | STEP 6 |
| 39–45 s | Rider leaves the shop, live map route แอมปักใต้ → บ้านลูกค้า, notification | STEP 7 |
| 45–50.5 s | Arrival, bag handover, 310 บาท cash, chat “ได้รับอาหารเรียบร้อยแล้ว” | STEP 8 |
| 50.5–55.6 s | Customer enjoys the food → end card with the LINE button and tagline | — |

The chat on the phone is one continuous conversation across steps 2–5. Each message appears one at a time, and
a typing indicator plays before every admin reply. The soundtrack (`tools/audio.cjs`) is synthesized in code:
a light marimba groove plus timed sound effects for send, LINE-style ding, tap, success chime, sizzle, scooter
and cash.

## Re-rendering

Requires Node, ffmpeg and Playwright with Chromium.

```bash
node tools/render.cjs ampaktai-line-order.mp4 4                # output file, parallel workers
node tools/render.cjs ampaktai-line-order-vertical.mp4 4 v     # vertical 9:16 version
node tools/snap.cjs /tmp/frames 12 30.6 47.8                   # PNG stills at given seconds (VERT=1 for vertical)
```

To change any Thai text, edit `index.html`. Chat messages live in `CH`, step captions in `STEPS` and
notifications in `NOTI`. The scene timing constants sit next to that text. Vertical positions are in `VS` (markup) and `LY` (layout constants).

Food photos in `assets/` are cropped from the restaurant's reference infographic. The font is Prompt
(Google Fonts, OFL).
