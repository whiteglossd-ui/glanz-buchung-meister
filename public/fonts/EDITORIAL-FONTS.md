# Editorial fonts

Downloaded on 2026-11-10 from Fontsource npm packages, version **5.3.0**.
The WOFF2 files are unchanged upstream Latin subsets; only filenames differ.
Both fonts are distributed under SIL Open Font License 1.1. Their complete
upstream licenses are included beside the font files.

| Local file | Upstream package / file | Style and weight axis | Bytes |
| --- | --- | --- | --- |
| `cormorant-garamond-latin-400.woff2` | `@fontsource/cormorant-garamond` / `files/cormorant-garamond-latin-400-normal.woff2` | normal, 400 | 22,876 |
| `geist-latin-variable.woff2` | `@fontsource-variable/geist` / `files/geist-latin-wght-normal.woff2` | normal, 100–900 | 29,400 |

Sources:

- [Cormorant Garamond regular archive](https://registry.npmjs.org/@fontsource/cormorant-garamond/-/cormorant-garamond-5.3.0.tgz), [upstream project](https://github.com/CatharsisFonts/Cormorant), license: `cormorant-garamond-OFL.txt`.
- [Geist archive](https://registry.npmjs.org/@fontsource-variable/geist/-/geist-5.3.0.tgz), [upstream project](https://github.com/vercel/geist-font), license: `geist-OFL.txt`.

The Latin subsets include `ÄÖÜäöüß`, the euro sign and German typographic
quotation marks. Fontconfig successfully decoded both WOFF2 files and verified
their character maps, including U+00C4/U+00D6/U+00DC/U+00DF/U+00E4/U+00F6/U+00FC,
U+20AC and U+201E/U+201C. No external font request is needed at runtime.

SHA-256:

```text
8048ac209bec741e1c29cd0cfac5aac1c0c2ba8c3ddbd4a58fa9bd92ef5c63c2  cormorant-garamond-latin-400.woff2
19f9c92546aa300c312235e3125af1b81394d8db9a4bc4a425cd5b641d2d54e1  geist-latin-variable.woff2
```

Cormorant 400 is the only registered serif face and the only Cormorant preload.
Public headings and `.font-display` labels use 400; any heavier emphasis is
synthesised from this face instead of downloading another font. Geist retains
its variable weights. The two public font files total **52,276 bytes**, saving
**14,764 bytes (22%)** against the original pair of variable font files.
Fontconfig verified the regular face's complete Latin character coverage.
Barlow files remain available for the existing application/admin design.

## Dark Edition: WG Display (Barlow Semi Condensed)

Added on 2026-11-25 from the supplied “White-Gloss Detailing – Dark Edition”
package. The files are unchanged WOFF2 faces of **Barlow Semi Condensed**
(Version 1.408, Copyright 2017 The Barlow Project Authors,
https://github.com/jpt/barlow), licensed under SIL Open Font License 1.1
(http://scripts.sil.org/OFL). The Latin subset covers `ÄÖÜäöüß`, `€` and
German quotation marks (checked with fontTools).

| Local file | Face | CSS weight in `dark-edition.css` | Bytes |
| --- | --- | --- | --- |
| `bsc-200.woff2` | ExtraLight | 300 | 22,008 |
| `bsc-300.woff2` | Light | 400 (headings) | 22,116 |
| `bsc-400.woff2` | Regular | 500 | 22,300 |
| `bsc-500.woff2` | Medium | 600 | 22,428 |

The CSS weights are shifted one step lighter on purpose, matching the
supplied design: headings declared at 400 render the Light face.

```text
2ea0aa2cabeee63c7d6e6ea2268c3be3c130a07c840305089b0ffaecccaab148  bsc-200.woff2
159d75490dba5ff4b24be2c2f18bf0ce1cc59f8df587a67d07e1801a19343f24  bsc-300.woff2
d03a7a5f6b74534c80699289d4f6495fdb09a7596774a4ede79129d2f8bb67b1  bsc-400.woff2
0d7513795eaf8fdab7f340144841bd2d9fac7d9303c03aa6b525a2c908e9b371  bsc-500.woff2
```
