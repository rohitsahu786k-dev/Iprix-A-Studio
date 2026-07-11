# A+ Studio Extension

AI listing autofill studio for Indian sellers by Iprix Media.

## Load locally

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `extension` folder in this project

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
- Low-Shipping Studio (`platforms/meesho/low-shipping.js`) — floating drawer on `supplier.meesho.com` with a shipping-slab estimator, a variant A/B price tracker (chrome.storage.local) and a deep-link to the webapp image generator.

## Assist, don't automate (Meesho ToS boundary)

The Low-Shipping Studio and Image Guard NEVER click buttons, submit forms, create catalogs or upload images into Meesho's DOM. They only render their own shadow-DOM UI, read shipping text already visible on the page when the seller explicitly presses "Record shown price", and open the A+ Studio webapp in a new tab. The seller performs every panel action manually. Automated actions on the supplier panel violate Meesho's terms and risk seller account bans — do not add them.

## Security

- No OpenAI, MongoDB, Razorpay, Cloudinary or SMTP secret belongs in the extension.
- API calls must go through `https://iprixmedia.com`.
- Keep extension permissions minimal before Chrome Web Store upload.
