# Contributing

Thanks for helping. This collection grows through pull requests: a new scheme, a fix to one, or an improvement to the gallery. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first; everyone taking part follows it.

Problems with the Xcasca app itself belong with the app's own support, not here; this is an unofficial project, unrelated to the company behind the app.

## Add a color scheme

### 1. Make it in Xcasca

You need Xcasca 1.1.2 or later, on the desktop or on mobile.

1. Open **Terminal Color Schemes** (on the desktop: **&#8942;** > **Tools** > **Terminal Color Schemes...**).
2. Click **New**, or start from a copy of an existing scheme (**Save As** under **&#8942;** on the desktop, **Duplicate** on mobile), and set the colors. The preview at the top shows them on sample text.
3. Give it a name and save it.

### 2. Export it from the app

Select the scheme, open **&#8942;** under the list, and choose **Export...**. The app writes `<name>.xccolorscheme`.

Commit that file as it is. The check below compares every file with the exact layout the app writes, so a file exported from the app passes, and a file written or edited by hand often does not. If you did edit one by hand, `npm run format` puts it back in the app's layout.

### 3. Add it to the repository

1. Put the file in [`schemes/terminal/`](schemes/terminal/), named after the scheme: `My Scheme.xccolorscheme`. The app already names it this way.
2. Add an entry for it to [`credits.json`](credits.json), in alphabetical order:

   ```json
   "My Scheme": {
     "kind": "original",
     "author": "your-github-name",
     "url": "https://github.com/your-github-name",
     "license": "MIT"
   }
   ```

   | Field | What to write |
   |---|---|
   | `kind` | `original` for a scheme you designed, `community` for a scheme someone else published, `built-in` for one that ships with Xcasca. |
   | `author` | Who made it. For a community scheme, the original author or project. |
   | `url` | Where it comes from: your profile for an original, the original project for a community scheme. Must start with `https://`. |
   | `license` | The license of the colors. An original is contributed under this repository's MIT License. |

3. Run the checks and update the list:

   ```sh
   npm run validate
   npm run catalog
   ```

4. Look at it in the gallery with `npm run preview`, at http://localhost:4173.

### 4. Open a pull request

Fill in the template. A check runs on every pull request and marks each file it rejects with the reason, so you see what to fix even without running anything yourself.

## What makes a scheme acceptable

The check enforces these; the reasons are here so the rules make sense.

- **The app's file format, exactly.** `app`, `type`, `version`, `name` and `data`, in that order; the 22 colors in the order the app writes them; two spaces of indent and a line feed at the end; UTF-8 with no byte order mark; no tabs and no CR line endings. A file that differs was not exported by the app and may not import.
- **Colors as `#RRGGBB`.** The selection may carry alpha as `#RRGGBBAA`, and should: Xcasca draws the selection over the text, so an opaque selection hides what is selected. The foreground at about 30% (`4D`) works well.
- **A name that works everywhere.** Printable ASCII only, 64 characters at most, no `\ / : * ? " < > |`, and no space or dot at the end. The name is also the file name, on every system and in every URL.
- **Nothing repeated.** No two schemes share a name, ignoring case, and no two share their colors. Two schemes whose colors differ by only a few steps are rejected as the same scheme.
- **Readable text.** The foreground has to stand out from the background by at least 3:1; under 4.5:1, the check warns.
- **A license that allows it.** A community scheme must come from a project whose license allows redistribution, such as MIT, Apache 2.0, BSD or public domain, and it keeps its original name. Name the project in `credits.json`.
- **Something new.** A scheme should look clearly different from the ones already here.

Leave the three search highlight colors (`searchHitBackground`, `searchHitBackgroundCurrent` and `searchHitForeground`) as the app sets them, unless they are hard to see on your background.

## Fix a scheme

Change it in the app, export it again over the old file, and open a pull request that says what was wrong. If you are not sure how to fix it, [open an issue](https://github.com/jooy2/xcasca-color-scheme/issues/new/choose) with a screenshot instead.

## Improve the gallery

The page lives in [`site/`](site/) and the build scripts in [`scripts/`](scripts/). `site/index.html` is a template the build renders once per language; its text comes from `site/i18n/<language>.json`, and a new string goes into all five files. There are no dependencies: `npm run preview` builds the page and serves it locally. The sample sessions the page draws come from `scripts/sample.mjs`; run `npm run sample` after changing it.

## Commit messages

Short and in the imperative, such as `Add the Harbor Night scheme` or `Fix the selection color of Graphite`.
