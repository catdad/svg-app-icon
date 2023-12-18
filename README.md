# svg app icon

> 🎨 Create high-quality desktop app icons for Windows, MacOS, and Linux using an SVG source

[![CI][ci.svg]][ci.link]
[![npm-downloads][npm-downloads.svg]][npm.link]
[![npm-version][npm-version.svg]][npm.link]

[ci.svg]: https://github.com/catdad/svg-app-icon/actions/workflows/ci.yml/badge.svg
[ci.link]: https://github.com/catdad/svg-app-icon/actions/workflows/ci.yml
[npm-downloads.svg]: https://img.shields.io/npm/dm/svg-app-icon.svg
[npm.link]: https://www.npmjs.com/package/svg-app-icon
[npm-version.svg]: https://img.shields.io/npm/v/svg-app-icon.svg

## 📥 Install

```bash
npm install svg-app-icon
```

## 👨‍💻 API

```javascript
const path = require('path');
const { promises: fs } = require('fs');
const { generateIcons } = require('svg-app-icon');

(async () => {
  const svg = await fs.readFile('my-icon.svg');

  for await (const icon of generateIcons(svg)) {
    await fs.writeFile(path.resolve('./my-output-directory', icon.name), icon.buffer);
  }
})();
```

### `generateIcons(svgs, options)` → `AsyncGenerator`

The arguments for this method are:
* `svgs` _`String`|`Buffer`|`Array<String|Buffer>`_ - the SVG or SVG layers that you'd like to use as the icon. When multiple images are passed in, they will be layered on top of one another in the provided order
* `[options]` _`Object`_ - the options, everything is optional
  * `[icns = true]` _`Boolean`_ - whether to generate an ICNS icon for MacOS
  * `[ico = true]` _`Boolean`_ - whether to generate an ICO icon for Windows
  * `[png = true]` _`Boolean`_ - whether to generate all PNG icon sizes for Linux
  * `[svg = true]` _`Boolean`_ - whether to generate output the original SVG to the output destination
  * `[pngSizes = [32, 256, 512]]` _`Array<Integer>`_ - the sizes to output for PNG icons, in case you need any additional sizes

The [`AsyncGenerator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator) will yield `icon` opject. They contain the following properties:
* `name` _`String`_: the name of the file.
* `ext` _`String`_: the extension that should be used for the file. One of `['png', 'icns', 'ico']`
* `buffer` _`Buffer`_: the bytes of the generated icon file
* `size` _`Number`_: optional, only present for `png` icons, this is the size that was used to render the icon

## 💻 CLI

You can also generate icons from the command line, so you don't have to write anything.

```bash
npx svg-app-icon < input.svg
```

Here are all the options (spoiler: they are the same as the API):

```
Usage:
  svg-app-icon [options] < input.svg

Options:
  --help             Show help
  --version          Show the version
  --destination, -d  Directory to output icons            [string]   [default: icons]
  --layer, -l        Add individual svg images as layers  [string[]]
                     stdin is ignored when using layers
  --include, -i      Which icons to create                [string[]] [default: icns, ico, png, svg]
  --png-size, -s     What size png images create          [number[]] [default: 32, 256, 512]

Note: all array arguments can be defined more than once

Examples:
  svg-app-icon < input.svg
  svg-app-icon --include icns --include ico < input.svg
  svg-app-icon --layer background.svg --layer foreground.svg
  cat input.svg | svg-app-icon --destination build/assets
```

## 🤷‍♀️ But Why?

There are very many tools to help you generate desktop app icons. They all, however, take one large PNG file as input and scale it down to generate all the necessary sizes. However, I have two problems:
* I generate all my icons as SVG and would prefer not to manually pre-process them. I just want to check out the repo and have everything else automated.
* I noticed that all the PNG-scaling solutions end up creating poor quality PNG images, especially for the smaller sizes. This results in icons that look bad.

Since I use SVG, I actually don't need to scale PNG images. I can arbitrarily generate images of any size from the initial SVG. It just so happens that there are many solutions for that as well. However, for the most part, all have tradeoffs and quality issues as well. This module uses [`svg-render`](https://github.com/catdad-experiments/svg-render) in order to create high-quality PNGs at any size. You can even use responsive SVGs, to render customized and optimized icons for every size. Try it, it's fun! 🎉
