# Xcasca Color Scheme Gallery

Free **terminal color schemes** (themes) for [Xcasca](https://www.xcasca.com), the SSH terminal for desktop and mobile. Preview each one in the online gallery, download the `.xccolorscheme` file, and import it in a few clicks.

<p align="center">
  <img src="docs/images/hero.png" width="900" alt="Xcasca on macOS and on an Android phone, both drawing a terminal session in the Harbor Night color scheme">
</p>

<p align="center">
  <a href="https://jooy2.github.io/xcasca-color-scheme/"><strong>Open the gallery</strong></a>
  &nbsp;·&nbsp;
  <a href="#apply-a-scheme">Apply a scheme</a>
  &nbsp;·&nbsp;
  <a href="CONTRIBUTING.md">Add a scheme</a>
</p>

<p align="center"><sub>An unofficial project, unrelated to the company behind Xcasca.</sub></p>

## What you get

Terminal color schemes as `.xccolorscheme` files, which Xcasca 1.1.2 or later imports on macOS, Windows, Linux, Android and iOS, in three groups:

- **Built into Xcasca**: the ones the app ships with, for anyone who changed them and wants the originals back.
- **Community favorites**: well-known schemes such as Dracula, Nord, Gruvbox and Catppuccin, under their original names. Each keeps its author's license, listed in [CREDITS.md](CREDITS.md).
- **Originals**: made for this collection.

Every file was exported from the app itself, and every pull request is checked against the format the app writes, so a file imports as it is.

## Preview

The [gallery](https://jooy2.github.io/xcasca-color-scheme/) draws each scheme on the same sample sessions: a shell with a file listing, `git status` and `git log`, a code diff with syntax colors, a color test of every style and color pair, and text in Korean, Japanese and Chinese. Switch between schemes to compare them line by line, type in the terminal, filter by dark or light, and download the one you like.

To make a scheme of your own, open the [editor](https://jooy2.github.io/xcasca-color-scheme/editor/): start from any scheme here or from a file you have, change the colors on the same live terminal, and download a `.xccolorscheme` file in the exact layout Xcasca exports.

The gallery reads in [English](https://jooy2.github.io/xcasca-color-scheme/), [한국어](https://jooy2.github.io/xcasca-color-scheme/ko/), [日本語](https://jooy2.github.io/xcasca-color-scheme/ja/), [简体中文](https://jooy2.github.io/xcasca-color-scheme/zh-hans/), [繁體中文](https://jooy2.github.io/xcasca-color-scheme/zh-hant/), [Español](https://jooy2.github.io/xcasca-color-scheme/es/), [Deutsch](https://jooy2.github.io/xcasca-color-scheme/de/) and [Français](https://jooy2.github.io/xcasca-color-scheme/fr/).

## Download

- **One scheme:** the **Download** button in the gallery, or open the file under [`schemes/terminal/`](schemes/terminal/) and choose **Download raw file**.
- **All of them:** **Code** > **Download ZIP** at the top of this page. The schemes are in `schemes/terminal/`.
- **For another terminal app:** **For other apps**, beside **Download** in the gallery and in the editor, writes the same colors for Xshell, Windows Terminal, iTerm2, Ghostty, Alacritty, Kitty or WezTerm. The selection becomes a solid color, and the search highlight colors, which only Xcasca has, are left out.

## Apply a scheme

Import the file once, then choose it for any session. An imported scheme is kept with the ones you make yourself, and syncs to your other devices if you use sync.

### Desktop

The same steps work on macOS, Windows and Linux.

1. Open the **&#8942;** menu at the top right, then **Tools** > **Terminal Color Schemes...**

   <img src="docs/images/desktop-1-open-manager.png" width="640" alt="The menu open on Tools, with Terminal Color Schemes highlighted">

2. Click **&#8942;** under the list, choose **Import...**, and pick the file you downloaded.

   <img src="docs/images/desktop-2-import.png" width="640" alt="The Terminal Color Schemes window with Import highlighted in its menu">

3. The scheme joins the list. Click **Close**.

   <img src="docs/images/desktop-3-imported.png" width="640" alt="The imported scheme selected in the list, with its colors shown">

4. Click the session properties button on the toolbar, then **Current Session**. To use the scheme for every new session instead, choose **Default Session**.

   <img src="docs/images/desktop-4-properties.png" width="640" alt="The session properties button with Current Session highlighted">

5. Under **Appearance**, choose the scheme in **Color Scheme** and click **OK**.

   <img src="docs/images/desktop-5-apply.png" width="640" alt="Session properties with the color scheme chosen and OK highlighted">

6. The terminal takes the new colors right away.

   <img src="docs/images/desktop-6-applied.png" width="640" alt="The terminal drawn with the new color scheme">

### Android

The iPhone app follows the same steps.

| 1. Open the menu at the bottom left of the home screen and tap **Terminal Color Schemes**. | 2. Tap **+**, then **Import**, and pick the downloaded file. | 3. The scheme joins the list. |
|---|---|---|
| <img src="docs/images/android-1-open-menu.png" width="240" alt="The app menu with Terminal Color Schemes highlighted"> | <img src="docs/images/android-2-import.png" width="240" alt="The add menu with Import highlighted"> | <img src="docs/images/android-3-imported.png" width="240" alt="The imported scheme highlighted in the list"> |
| **4.** In **Sessions**, press and hold a session, then tap **Edit**. | **5.** Under **Appearance**, pick the scheme in **Color Scheme**, then tap the check mark to save. | **6.** Open the session to see the new colors. |
| <img src="docs/images/android-4-edit.png" width="240" alt="A session's menu with Edit highlighted"> | <img src="docs/images/android-5-apply.png" width="240" alt="Session properties with the color scheme chosen and the save button highlighted"> | <img src="docs/images/android-6-applied.png" width="240" alt="The terminal drawn with the new color scheme"> |

If a scheme with the same name is already in the app, the imported one gets a number, such as `Dracula (1)`.

## The schemes

<!-- catalog:start -->

### Built into Xcasca

The schemes the app ships with, as the app exports them.

| Preview | Scheme | Mode | Made by | License |
|---|---|---|---|---|
| <img src="docs/swatches/terminal/Campbell.svg" width="210" alt="Campbell"> | [Campbell](schemes/terminal/Campbell.xccolorscheme) | Dark | [Microsoft (Windows Terminal)](https://github.com/microsoft/terminal) | MIT |
| <img src="docs/swatches/terminal/Campbell%20PowerShell.svg" width="210" alt="Campbell PowerShell"> | [Campbell PowerShell](schemes/terminal/Campbell%20PowerShell.xccolorscheme) | Dark | [Microsoft (Windows Terminal)](https://github.com/microsoft/terminal) | MIT |
| <img src="docs/swatches/terminal/Default.svg" width="210" alt="Default"> | [Default](schemes/terminal/Default.xccolorscheme) | Dark | [Tango Desktop Project](https://en.wikipedia.org/wiki/Tango_Desktop_Project) | Public domain |
| <img src="docs/swatches/terminal/One%20Half%20Dark.svg" width="210" alt="One Half Dark"> | [One Half Dark](schemes/terminal/One%20Half%20Dark.xccolorscheme) | Dark | [Son A. Pham](https://github.com/sonph/onehalf) | MIT |
| <img src="docs/swatches/terminal/One%20Half%20Light.svg" width="210" alt="One Half Light"> | [One Half Light](schemes/terminal/One%20Half%20Light.xccolorscheme) | Light | [Son A. Pham](https://github.com/sonph/onehalf) | MIT |
| <img src="docs/swatches/terminal/Solarized%20Dark.svg" width="210" alt="Solarized Dark"> | [Solarized Dark](schemes/terminal/Solarized%20Dark.xccolorscheme) | Dark | [Ethan Schoonover](https://github.com/altercation/solarized) | MIT |
| <img src="docs/swatches/terminal/Solarized%20Light.svg" width="210" alt="Solarized Light"> | [Solarized Light](schemes/terminal/Solarized%20Light.xccolorscheme) | Light | [Ethan Schoonover](https://github.com/altercation/solarized) | MIT |
| <img src="docs/swatches/terminal/Tango%20Dark.svg" width="210" alt="Tango Dark"> | [Tango Dark](schemes/terminal/Tango%20Dark.xccolorscheme) | Dark | [Tango Desktop Project](https://en.wikipedia.org/wiki/Tango_Desktop_Project) | Public domain |
| <img src="docs/swatches/terminal/Tango%20Light.svg" width="210" alt="Tango Light"> | [Tango Light](schemes/terminal/Tango%20Light.xccolorscheme) | Light | [Tango Desktop Project](https://en.wikipedia.org/wiki/Tango_Desktop_Project) | Public domain |
| <img src="docs/swatches/terminal/Vintage.svg" width="210" alt="Vintage"> | [Vintage](schemes/terminal/Vintage.xccolorscheme) | Dark | [Microsoft (Windows Terminal)](https://github.com/microsoft/terminal) | MIT |

### Community favorites

Well-known schemes, under their original names and licenses.

| Preview | Scheme | Mode | Made by | License |
|---|---|---|---|---|
| <img src="docs/swatches/terminal/Atom%20One%20Light.svg" width="210" alt="Atom One Light"> | [Atom One Light](schemes/terminal/Atom%20One%20Light.xccolorscheme) | Light | [GitHub (Atom)](https://github.com/atom/atom) | MIT |
| <img src="docs/swatches/terminal/Ayu%20Mirage.svg" width="210" alt="Ayu Mirage"> | [Ayu Mirage](schemes/terminal/Ayu%20Mirage.xccolorscheme) | Dark | [ayu-theme](https://github.com/ayu-theme/ayu-colors) | MIT |
| <img src="docs/swatches/terminal/Carbonfox.svg" width="210" alt="Carbonfox"> | [Carbonfox](schemes/terminal/Carbonfox.xccolorscheme) | Dark | [EdenEast](https://github.com/EdenEast/nightfox.nvim) | MIT |
| <img src="docs/swatches/terminal/Catppuccin%20Frappe.svg" width="210" alt="Catppuccin Frappe"> | [Catppuccin Frappe](schemes/terminal/Catppuccin%20Frappe.xccolorscheme) | Dark | [Catppuccin](https://github.com/catppuccin/catppuccin) | MIT |
| <img src="docs/swatches/terminal/Catppuccin%20Latte.svg" width="210" alt="Catppuccin Latte"> | [Catppuccin Latte](schemes/terminal/Catppuccin%20Latte.xccolorscheme) | Light | [Catppuccin](https://github.com/catppuccin/catppuccin) | MIT |
| <img src="docs/swatches/terminal/Catppuccin%20Macchiato.svg" width="210" alt="Catppuccin Macchiato"> | [Catppuccin Macchiato](schemes/terminal/Catppuccin%20Macchiato.xccolorscheme) | Dark | [Catppuccin](https://github.com/catppuccin/catppuccin) | MIT |
| <img src="docs/swatches/terminal/Catppuccin%20Mocha.svg" width="210" alt="Catppuccin Mocha"> | [Catppuccin Mocha](schemes/terminal/Catppuccin%20Mocha.xccolorscheme) | Dark | [Catppuccin](https://github.com/catppuccin/catppuccin) | MIT |
| <img src="docs/swatches/terminal/Dayfox.svg" width="210" alt="Dayfox"> | [Dayfox](schemes/terminal/Dayfox.xccolorscheme) | Light | [EdenEast](https://github.com/EdenEast/nightfox.nvim) | MIT |
| <img src="docs/swatches/terminal/Dracula.svg" width="210" alt="Dracula"> | [Dracula](schemes/terminal/Dracula.xccolorscheme) | Dark | [Zeno Rocha and the Dracula contributors](https://github.com/dracula/dracula-theme) | MIT |
| <img src="docs/swatches/terminal/Everforest%20Dark.svg" width="210" alt="Everforest Dark"> | [Everforest Dark](schemes/terminal/Everforest%20Dark.xccolorscheme) | Dark | [sainnhe](https://github.com/sainnhe/everforest) | MIT |
| <img src="docs/swatches/terminal/Everforest%20Light.svg" width="210" alt="Everforest Light"> | [Everforest Light](schemes/terminal/Everforest%20Light.xccolorscheme) | Light | [sainnhe](https://github.com/sainnhe/everforest) | MIT |
| <img src="docs/swatches/terminal/Flexoki%20Dark.svg" width="210" alt="Flexoki Dark"> | [Flexoki Dark](schemes/terminal/Flexoki%20Dark.xccolorscheme) | Dark | [Steph Ango](https://github.com/kepano/flexoki) | MIT |
| <img src="docs/swatches/terminal/Flexoki%20Light.svg" width="210" alt="Flexoki Light"> | [Flexoki Light](schemes/terminal/Flexoki%20Light.xccolorscheme) | Light | [Steph Ango](https://github.com/kepano/flexoki) | MIT |
| <img src="docs/swatches/terminal/GitHub%20Dark%20Default.svg" width="210" alt="GitHub Dark Default"> | [GitHub Dark Default](schemes/terminal/GitHub%20Dark%20Default.xccolorscheme) | Dark | [GitHub (Primer)](https://github.com/primer/github-vscode-theme) | MIT |
| <img src="docs/swatches/terminal/GitHub%20Dark%20Dimmed.svg" width="210" alt="GitHub Dark Dimmed"> | [GitHub Dark Dimmed](schemes/terminal/GitHub%20Dark%20Dimmed.xccolorscheme) | Dark | [GitHub (Primer)](https://github.com/primer/github-vscode-theme) | MIT |
| <img src="docs/swatches/terminal/GitHub%20Light%20Default.svg" width="210" alt="GitHub Light Default"> | [GitHub Light Default](schemes/terminal/GitHub%20Light%20Default.xccolorscheme) | Light | [GitHub (Primer)](https://github.com/primer/github-vscode-theme) | MIT |
| <img src="docs/swatches/terminal/Gruvbox%20Dark.svg" width="210" alt="Gruvbox Dark"> | [Gruvbox Dark](schemes/terminal/Gruvbox%20Dark.xccolorscheme) | Dark | [Pavel Pertsev](https://github.com/morhetz/gruvbox) | MIT |
| <img src="docs/swatches/terminal/Gruvbox%20Light.svg" width="210" alt="Gruvbox Light"> | [Gruvbox Light](schemes/terminal/Gruvbox%20Light.xccolorscheme) | Light | [Pavel Pertsev](https://github.com/morhetz/gruvbox) | MIT |
| <img src="docs/swatches/terminal/Gruvbox%20Material%20Dark.svg" width="210" alt="Gruvbox Material Dark"> | [Gruvbox Material Dark](schemes/terminal/Gruvbox%20Material%20Dark.xccolorscheme) | Dark | [sainnhe](https://github.com/sainnhe/gruvbox-material) | MIT |
| <img src="docs/swatches/terminal/Gruvbox%20Material%20Light.svg" width="210" alt="Gruvbox Material Light"> | [Gruvbox Material Light](schemes/terminal/Gruvbox%20Material%20Light.xccolorscheme) | Light | [sainnhe](https://github.com/sainnhe/gruvbox-material) | MIT |
| <img src="docs/swatches/terminal/Iceberg%20Dark.svg" width="210" alt="Iceberg Dark"> | [Iceberg Dark](schemes/terminal/Iceberg%20Dark.xccolorscheme) | Dark | [cocopon](https://github.com/cocopon/iceberg.vim) | MIT |
| <img src="docs/swatches/terminal/Iceberg%20Light.svg" width="210" alt="Iceberg Light"> | [Iceberg Light](schemes/terminal/Iceberg%20Light.xccolorscheme) | Light | [cocopon](https://github.com/cocopon/iceberg.vim) | MIT |
| <img src="docs/swatches/terminal/Kanagawa%20Dragon.svg" width="210" alt="Kanagawa Dragon"> | [Kanagawa Dragon](schemes/terminal/Kanagawa%20Dragon.xccolorscheme) | Dark | [rebelot](https://github.com/rebelot/kanagawa.nvim) | MIT |
| <img src="docs/swatches/terminal/Kanagawa%20Wave.svg" width="210" alt="Kanagawa Wave"> | [Kanagawa Wave](schemes/terminal/Kanagawa%20Wave.xccolorscheme) | Dark | [rebelot](https://github.com/rebelot/kanagawa.nvim) | MIT |
| <img src="docs/swatches/terminal/Night%20Owl.svg" width="210" alt="Night Owl"> | [Night Owl](schemes/terminal/Night%20Owl.xccolorscheme) | Dark | [Sarah Drasner](https://github.com/sdras/night-owl-vscode-theme) | MIT |
| <img src="docs/swatches/terminal/Nightfox.svg" width="210" alt="Nightfox"> | [Nightfox](schemes/terminal/Nightfox.xccolorscheme) | Dark | [EdenEast](https://github.com/EdenEast/nightfox.nvim) | MIT |
| <img src="docs/swatches/terminal/Nord.svg" width="210" alt="Nord"> | [Nord](schemes/terminal/Nord.xccolorscheme) | Dark | [Sven Greb (Nord)](https://github.com/nordtheme/nord) | MIT |
| <img src="docs/swatches/terminal/Rose%20Pine.svg" width="210" alt="Rose Pine"> | [Rose Pine](schemes/terminal/Rose%20Pine.xccolorscheme) | Dark | [Rose Pine](https://github.com/rose-pine/rose-pine-theme) | MIT |
| <img src="docs/swatches/terminal/Rose%20Pine%20Dawn.svg" width="210" alt="Rose Pine Dawn"> | [Rose Pine Dawn](schemes/terminal/Rose%20Pine%20Dawn.xccolorscheme) | Light | [Rose Pine](https://github.com/rose-pine/rose-pine-theme) | MIT |
| <img src="docs/swatches/terminal/Rose%20Pine%20Moon.svg" width="210" alt="Rose Pine Moon"> | [Rose Pine Moon](schemes/terminal/Rose%20Pine%20Moon.xccolorscheme) | Dark | [Rose Pine](https://github.com/rose-pine/rose-pine-theme) | MIT |
| <img src="docs/swatches/terminal/Selenized%20Dark.svg" width="210" alt="Selenized Dark"> | [Selenized Dark](schemes/terminal/Selenized%20Dark.xccolorscheme) | Dark | [Jan Warchol](https://github.com/jan-warchol/selenized) | MIT |
| <img src="docs/swatches/terminal/Selenized%20Light.svg" width="210" alt="Selenized Light"> | [Selenized Light](schemes/terminal/Selenized%20Light.xccolorscheme) | Light | [Jan Warchol](https://github.com/jan-warchol/selenized) | MIT |
| <img src="docs/swatches/terminal/Seoulbones%20Light.svg" width="210" alt="Seoulbones Light"> | [Seoulbones Light](schemes/terminal/Seoulbones%20Light.xccolorscheme) | Light | [Michael Chris Lopez (Zenbones)](https://github.com/zenbones-theme/zenbones.nvim) | MIT |
| <img src="docs/swatches/terminal/Snazzy.svg" width="210" alt="Snazzy"> | [Snazzy](schemes/terminal/Snazzy.xccolorscheme) | Dark | [Sindre Sorhus](https://github.com/sindresorhus/hyper-snazzy) | MIT |
| <img src="docs/swatches/terminal/Sonokai.svg" width="210" alt="Sonokai"> | [Sonokai](schemes/terminal/Sonokai.xccolorscheme) | Dark | [sainnhe](https://github.com/sainnhe/sonokai) | MIT |
| <img src="docs/swatches/terminal/Tokyo%20Night.svg" width="210" alt="Tokyo Night"> | [Tokyo Night](schemes/terminal/Tokyo%20Night.xccolorscheme) | Dark | [Folke Lemaitre](https://github.com/folke/tokyonight.nvim) | Apache-2.0 |
| <img src="docs/swatches/terminal/Tokyo%20Night%20Day.svg" width="210" alt="Tokyo Night Day"> | [Tokyo Night Day](schemes/terminal/Tokyo%20Night%20Day.xccolorscheme) | Light | [Folke Lemaitre](https://github.com/folke/tokyonight.nvim) | Apache-2.0 |
| <img src="docs/swatches/terminal/Tokyo%20Night%20Storm.svg" width="210" alt="Tokyo Night Storm"> | [Tokyo Night Storm](schemes/terminal/Tokyo%20Night%20Storm.xccolorscheme) | Dark | [Folke Lemaitre](https://github.com/folke/tokyonight.nvim) | Apache-2.0 |
| <img src="docs/swatches/terminal/Tomorrow.svg" width="210" alt="Tomorrow"> | [Tomorrow](schemes/terminal/Tomorrow.xccolorscheme) | Light | [Chris Kempson](https://github.com/chriskempson/tomorrow-theme) | MIT |
| <img src="docs/swatches/terminal/Tomorrow%20Night.svg" width="210" alt="Tomorrow Night"> | [Tomorrow Night](schemes/terminal/Tomorrow%20Night.xccolorscheme) | Dark | [Chris Kempson](https://github.com/chriskempson/tomorrow-theme) | MIT |
| <img src="docs/swatches/terminal/Tomorrow%20Night%20Eighties.svg" width="210" alt="Tomorrow Night Eighties"> | [Tomorrow Night Eighties](schemes/terminal/Tomorrow%20Night%20Eighties.xccolorscheme) | Dark | [Chris Kempson](https://github.com/chriskempson/tomorrow-theme) | MIT |

### Originals

Made for this collection.

| Preview | Scheme | Mode | Made by | License |
|---|---|---|---|---|
| <img src="docs/swatches/terminal/Dancheong.svg" width="210" alt="Dancheong"> | [Dancheong](schemes/terminal/Dancheong.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Ember%20Glow.svg" width="210" alt="Ember Glow"> | [Ember Glow](schemes/terminal/Ember%20Glow.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Graphite.svg" width="210" alt="Graphite"> | [Graphite](schemes/terminal/Graphite.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Harbor%20Night.svg" width="210" alt="Harbor Night"> | [Harbor Night](schemes/terminal/Harbor%20Night.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Lapis.svg" width="210" alt="Lapis"> | [Lapis](schemes/terminal/Lapis.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Midnight%20Plum.svg" width="210" alt="Midnight Plum"> | [Midnight Plum](schemes/terminal/Midnight%20Plum.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Monsoon.svg" width="210" alt="Monsoon"> | [Monsoon](schemes/terminal/Monsoon.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Morning%20Fog.svg" width="210" alt="Morning Fog"> | [Morning Fog](schemes/terminal/Morning%20Fog.xccolorscheme) | Light | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Moss%20Garden.svg" width="210" alt="Moss Garden"> | [Moss Garden](schemes/terminal/Moss%20Garden.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Neon%20Drift.svg" width="210" alt="Neon Drift"> | [Neon Drift](schemes/terminal/Neon%20Drift.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Paper%20Ink.svg" width="210" alt="Paper Ink"> | [Paper Ink](schemes/terminal/Paper%20Ink.xccolorscheme) | Light | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Sandstone.svg" width="210" alt="Sandstone"> | [Sandstone](schemes/terminal/Sandstone.xccolorscheme) | Light | [jooy2](https://github.com/jooy2) | MIT |
| <img src="docs/swatches/terminal/Velvet%20Dusk.svg" width="210" alt="Velvet Dusk"> | [Velvet Dusk](schemes/terminal/Velvet%20Dusk.xccolorscheme) | Dark | [jooy2](https://github.com/jooy2) | MIT |

<!-- catalog:end -->

## Contributing

New schemes, fixes and gallery improvements are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to make a scheme in the app, export it, and open a pull request. Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Working on this repository

The scripts need Node.js 20 or later and nothing else; there are no dependencies to install.

| Command | What it does |
|---|---|
| `npm run validate` | Checks every scheme file and `credits.json`, the same check a pull request runs. |
| `npm run catalog` | Updates the scheme list in this README and the preview images in `docs/swatches/`. |
| `npm run format` | Rewrites hand-edited scheme files in the layout the app exports. |
| `npm run preview` | Builds the gallery into `_site/` and serves it at http://localhost:4173. |
| `npm run build` | Builds the gallery into `_site/`, as the deployment does, along with `llms.txt`, `sitemap.xml` and a 404 page. |
| `npm run sample` | Regenerates the sample sessions the gallery draws, in `site/samples/`. |

Pushing to `main` deploys the gallery to GitHub Pages.

## License

The code, the documentation and the original schemes are released under the [MIT License](LICENSE). The built-in and community schemes keep the licenses of their authors, listed in [CREDITS.md](CREDITS.md). The screenshots show the Xcasca app and are here to document how to use these files with it.
