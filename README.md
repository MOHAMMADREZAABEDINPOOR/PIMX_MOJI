<div align="center">

<img src="assets/readme/hero.gif" width="1200" alt="PIMX MOJI — rotating 3D geometry" />

**[English](README.md) · [فارسی](README.fa.md)**

<img src="assets/readme/identity.svg" width="1200" alt="web / English and Persian documentation" />

</div>

# PIMX MOJI

A browser image-to-character art studio with preset styles, a character picker, canvas processing, previews and conversion history.

[GitHub](https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_MOJI) · [PIMX / Profile](https://github.com/MOHAMMADREZAABEDINPOOR) · [Static artwork](assets/readme/hero.png)

## Features

- Image processing and configurable character palettes
- Preset previews, enlarged output and conversion history
- Language/theme settings in a shared context
- Optional Cloudflare D1 analytics endpoint

## Stack

| Tool | Version / source |
|---|---|
| React | `^19.0.0` |
| Vite | `^6.2.0` |
| TypeScript | `~5.8.2` |
| Express | `^4.21.2` |
| Motion | `^12.23.24` |
| Tailwind CSS | `^4.1.14` |

## Getting started

Node.js 22.12+ and the package manager declared in package.json. Install dependencies from the checked-in lockfile where available.

```bash
git clone https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_MOJI.git
cd PIMX_MOJI

npm ci
npm run dev
```

## Configuration

These names are found in the example configuration or source; not all are required. Check their defaults/usage in those files and supply secrets only in your local or hosting environment.

| Name | Role |
|---|---|
| `APP_URL` | Application setting; inspect its definition |
| `GEMINI_API_KEY` | Credential/connection setting; keep private |

Hosting bindings: `DB`.

## Usage

Load an image, choose a preset or character palette, adjust the controls and export the result. Try a small high-contrast image first.

## Project structure

| Path | Role |
|---|---|
| [`assets/`](assets/) | Brand/media/README assets |
| [`functions/`](functions/) | Hosting API functions |
| [`public/`](public/) | Public web assets |
| [`src/`](src/) | Application source |
| [`index.html`](index.html) | Project entry/configuration file |
| [`metadata.json`](metadata.json) | Project entry/configuration file |
| [`package.json`](package.json) | Project entry/configuration file |
| [`tsconfig.json`](tsconfig.json) | Project entry/configuration file |
| [`wrangler.toml`](wrangler.toml) | Project entry/configuration file |

## Commands and checks

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

These commands are declared in package.json; the list is not a test execution report. Test commands may need a browser, service or prepared database.

## Deployment

Deploy the build according to its architecture: server-backed projects need a Node process; static Vite frontends can host dist. Pages functions, KV or D1 require separate configuration.

## Limitations

Large images can use significant browser memory. The optional analytics backend needs its own D1 binding and schema; the art editor can run without that backend.

## Troubleshooting

- Missing packages: install dependencies using the project’s package manager.
- API/network failure: check the configured origin, provider and hosting bindings.
- Old assets: rebuild when a build script exists, then clear the browser cache.

## Contributing

Create a focused branch, verify the affected behavior and explain the change clearly. Keep private data, build outputs and local databases out of commits.

## License

No repository-level license file is included in this snapshot. Public visibility alone does not grant reuse rights; contact the repository owner for terms.

---

Part of **PIMX** · Documentation in English and Persian.
