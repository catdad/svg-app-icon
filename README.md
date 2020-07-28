# svg app icon

> 🖼 Create high-quality desktop app icons for Windows, MacOS, and Linux using an SVG source

[![travis][travis.svg]][travis.link]
[![npm-downloads][npm-downloads.svg]][npm.link]
[![npm-version][npm-version.svg]][npm.link]
[![dm-david][dm-david.svg]][dm-david.link]

[travis.svg]: https://travis-ci.com/catdad/svg-app-icon.svg?branch=master
[travis.link]: https://travis-ci.com/catdad/svg-app-icon
[npm-downloads.svg]: https://img.shields.io/npm/dm/svg-app-icon.svg
[npm.link]: https://www.npmjs.com/package/svg-app-icon
[npm-version.svg]: https://img.shields.io/npm/v/svg-app-icon.svg
[dm-david.svg]: https://david-dm.org/catdad/svg-app-icon.svg
[dm-david.link]: https://david-dm.org/catdad/svg-app-icon

## 📥 Install

```bash
npm install svg-app-icon
```

## 👨‍💻 API

```javascript
const { promises: fs } = require('fs');
const icons = require('svg-app-icon');

(async () => {
  const svg = await fs.readFile('my-icon.svg');

  await icons(svg, {
    destination: './my-output-directory'
  });
})();
```

### `icons(svg, options)` → `Promise`

The arguments for this method are:
* `svg` _`String`|`Buffer`_ - the SVG that you'd like to use as the icon
* `[options]` _`Object`_ - the options, everything is optional
  * `[destination = 'icons']` _`String`_ - the directory to output all icons to. If this direcotry doesn't exist, it will be created
  * `[icns = true]` _`Boolean`_ - whether to generate an ICNS icon for MacOS
  * `[ico = true]` _`Boolean`_ - whether to generate an ICO icon for Windows
  * `[png = true]` _`Boolean`_ - whether to generate all PNG icon sizes for Linux
  * `[svg = true]` _`Boolean`_ - whether to generate output the original SVG to the output destination
  * `[pngSizes = [32, 256, 512]]` _`Array<Integer>`_ - the sizes to output for PNG icons, in case you need any additional sizes

This promise resolves with `undefined`.

## 🤷‍♀️ But Why?

There are very many tools to help you generate desktop app icons. They all, however, take one large PNG file as input and scale it down to generate all the necessary sizes. However, I have two problems:
* I generate all my icons as SVG and would prefer not to manually pre-process them. I just want to check out the repo and have everyhting else automated.
* I noticed that all the PNG-scaling solutions end up creating poor quality PNG images, especially for the smaller sizes. This results in icons that look bad.

Since I use SVG, I actually don't need to scale PNG images. I can arbitrarily generate images of any size from the initial SVG. It just so happens that there are many solutions for that as well. However, for the most part, all have tradeoffs and quality issues as well. This module uses [`svg-render`](https://github.com/catdad-experiments/svg-render) in order to create high-quality PNGs at any size. You can even use responsive PNGs, to render customized and optimized icons for every size. Try it, it's fun! 🎉
