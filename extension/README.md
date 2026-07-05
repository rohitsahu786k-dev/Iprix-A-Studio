# A+ Studio Extension

AI listing autofill studio for Indian sellers by Iprix Media. This unpacked Manifest V3 extension is based on the Lisstify reference code and upgraded toward the A+ Studio roadmap.

## Load locally

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select this `listify` folder

## Source layout

Most files here are hand-edited directly and loaded as-is. `content-script.js` is
the one exception: it is a **generated build output** bundled from modular
source under [`src/content/`](src/content/):

- `src/content/toast.js` — in-page toast notifications
- `src/content/text-utils.js` — DOM label/selector extraction helpers
- `src/content/category.js` — page category detection
- `src/content/main.js` — everything else (sidebar, fill engine, FAB UI, Meesho library panel)

After editing anything under `extension/src/`, rebuild before reloading the
unpacked extension:

```bash
npm run extension:build
```

`npm run extension:dist` runs this automatically before minifying and zipping
for the Chrome Web Store.

## Features

- Save Current Form as Template — captures text, dropdown, chip, checkbox and image fields.
- Autofill — refills saved templates into fresh listing drafts without auto-submit.
- Bulk Fill — generates editable Excel rows and fills one-by-one or queued tabs.
- Smart Listings — product-by-product fill workflow from dashboard batches.
- Image Maker — sends product images to the server-side image pipeline.
- Studio Tools — scans page fields, estimates listing score, generates SKUs and stores local drafts.

## Security

- No OpenAI, MongoDB, Razorpay, Cloudinary or SMTP secret belongs in the extension.
- API calls must go through `https://iprixmedia.com`.
- Keep extension permissions minimal before Chrome Web Store upload.
