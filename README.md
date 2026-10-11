# ClearFrame

A static, client-side image metadata tool: remove AI-generator fingerprints and
other hidden metadata from JPEG/PNG/WebP images, inspect what's embedded
before and after, and optionally write your own camera EXIF values - all
entirely in the browser. No server, no uploads, no backend.

## How it works

- **Reading**: [`exifr`](https://github.com/MikeKovarik/exifr) parses EXIF/XMP/IPTC/ICC for display, plus hand-written binary scanners (`src/lib/jpeg.ts`, `png.ts`, `webp.ts`) that look for AI-generator fingerprints (Stable Diffusion `parameters`/`prompt` chunks, C2PA/JUMBF manifests, known tool names in the Software/XMP fields, etc).
- **Removal**: each format is parsed at the binary structure level (JPEG markers, PNG chunks, WebP RIFF chunks) and metadata segments/chunks are cut out directly - pixel data is **never** decoded/re-encoded through a canvas, so there is no quality loss or recompression.
- **EXIF editor**: a small hand-written TIFF/IFD builder (`src/lib/tiff.ts`) generates a standard EXIF block that gets embedded as a JPEG APP1 segment, a PNG `eXIf` chunk, or a WebP `EXIF` RIFF chunk - the same binary payload, three different containers.
- **Performance**: all of the above runs inside a Web Worker (`src/workers/image-worker.ts`) so processing a batch of large images never blocks the UI thread.

See the in-app FAQ for the exact behavioral differences between "Remove AI Metadata" and "Remove All Metadata" per format.

## Local development

```bash
npm install
npm run dev
```

Open the printed local URL. Hot reload is enabled.

## Production build

```bash
npm run build
```

Output goes to `dist/`. Preview it locally with:

```bash
npm run preview
```

## Deploying to Cloudflare Pages

**Framework preset:** None / Vite
**Build command:** `npm run build`
**Build output directory:** `dist`
**Root directory:** `/` (repo root)
**Node version:** 18 or later (set `NODE_VERSION` env var if needed, e.g. `20`)

Steps:

1. Push this repository to GitHub/GitLab.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, select the repo.
3. Set the build command/output directory above.
4. Deploy. Cloudflare Pages automatically serves `public/_redirects` (SPA fallback) and `public/_headers` (security headers) from the build output.
5. **Custom domain**: Pages project → **Custom domains → Set up a custom domain**, then follow the DNS instructions Cloudflare shows (a `CNAME` to your `*.pages.dev` subdomain, or Cloudflare manages it automatically if the domain's DNS is already on Cloudflare).

No environment variables, KV, D1, or server-side bindings are required - this is a fully static site.

## Browser support notes

- Requires `Web Worker`, `createImageBitmap`, and `Blob`/`File` APIs - supported in all current Chrome, Firefox, Safari and Edge versions.
- EXIF writing and AI-metadata removal are implemented as direct binary rewrites (no WASM dependency needed for the formats supported).

## Supported formats and limitations

| | JPEG | PNG | WebP |
|---|---|---|---|
| Remove AI metadata (keep camera EXIF) | ✅ | N/A - see FAQ | N/A - see FAQ |
| Remove all metadata | ✅ | ✅ | ✅ |
| Camera EXIF editor | ✅ | ✅ (via `eXIf` chunk) | ✅ (via `EXIF` RIFF chunk) |
| Transparency preserved | n/a (no alpha) | ✅ | ✅ |
| Recompression | Never | Never | Never |

PNG and WebP don't have a format-level split between "camera EXIF" and
"AI-generation metadata" the way JPEG's EXIF/XMP segments do, so for those
two formats "Remove AI Metadata" and "Remove All Metadata" strip the same
set of chunks. See the FAQ page in the app for the full explanation.

## Enabling Google AdSense

The site isn't showing ads yet (no approved publisher ID), but the groundwork
is in place: `public/_headers`'s CSP already allows the AdSense/doubleclick
domains, and the Privacy page already discloses future ad use. Once your
AdSense application is approved:

1. **`index.html`**: uncomment the `adsbygoogle.js` `<script>` tag near the top of `<head>` and replace `ca-pub-XXXXXXXXXXXXXXXX` with your real publisher ID.
2. **`public/ads.txt`**: uncomment the `google.com, pub-...` line and replace the placeholder ID with your real one.
3. **Ad units**: add `<ins class="adsbygoogle">` tags wherever you want ads to render (see [Google's ad unit docs](https://support.google.com/adsense/answer/9274025)), each followed by `<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`.
4. Rebuild (`npm run build`) and redeploy.

If a particular ad format needs a CSP exception beyond what's already allowed, AdSense's own error console will say so - add the specific domain to `public/_headers` rather than loosening the policy broadly.
