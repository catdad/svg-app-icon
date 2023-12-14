const { promises: fs } = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const { expect } = require('chai');
const tempy = require('tempy');
const del = require('del');

const maker = require('../');
const { validateIconsDirectory, svg, layers, png, type } = require('./helpers');

describe('app-icon-maker API filesystem icons', () => {
  let destination;

  afterEach(async () => {
    if (destination) {
      await del(destination, { force: true });
    }

    destination = null;
  });

  it('generates all icons by default usign svg string', async () => {
    destination = tempy.directory();

    await maker(svg, { destination });

    await validateIconsDirectory(destination);
  });

  it('generates all icons by default usign svg buffer', async () => {
    destination = tempy.directory();

    await maker(Buffer.from(svg), { destination });

    await validateIconsDirectory(destination);
  });

  it('will create the output directory if it does not exist', async () => {
    destination = tempy.directory();

    const exists = p => fs.access(p).then(() => true).catch(() => false);
    const outdir = path.resolve(destination, 'a/b/c/d');

    expect(await exists(outdir)).to.equal(false);

    await maker(svg, { destination: outdir });

    expect(await exists(outdir)).to.equal(true);
    await validateIconsDirectory(outdir);
  });

  for (let exclude of ['icns', 'ico', 'png', 'svg']) {
    it(`can optionally skip ${exclude} output`, async () => {
      destination = tempy.directory();

      await maker(svg, { destination, [exclude]: false });

      await validateIconsDirectory(destination, { [exclude]: false });
    });
  }

  it('can optionally generate arbitrary png sizes', async () => {
    destination = tempy.directory();
    const pngSizes = [47, 345, 1000];

    await maker(svg, { destination, icns: false, ico: false, svg: false, pngSizes });

    const actualFiles = await fs.readdir(destination);

    expect(actualFiles.sort()).to.deep.equal([
      '47x47.png',
      '345x345.png',
      '1000x1000.png'
    ].sort());

    for (let size of pngSizes) {
      const buffer = await fs.readFile(path.resolve(destination, `${size}x${size}.png`));
      expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
      const { width, height, depth } = png.read(buffer);

      expect(width).to.equal(size);
      expect(height).to.equal(size);
      expect(depth).to.equal(8);
    }
  });

  it('can composite multiple svg files as layers', async () => {
    destination = tempy.directory();
    await maker(layers, { destination });

    const hashes = {
      '32x32.png': 'c450e4c48d310cac5e1432dc3d8855b9a08da0c1e456eeacdbe4b809c8eb5b27',
      '256x256.png': '7413a0717534701a7518a4e35633cae0edb63002c31ef58f092c555f2fa4bdfb',
      // it's weird that these two are different?
      '512x512.png': '926163d94eb5dd6309861db76e952d8562c83b815583440508f79b8213ed44b7',
      'icon.svg': 'bba03b4311a86f6e6f6b7e8b37d444604bca27d95984bd56894ab98857a43cdf'
    };

    await validateIconsDirectory(destination, { hashes });
  });

  it('places all icons in "icons" directory when no options are provided', async () => {
    destination = tempy.directory();

    const cmd = process.execPath;
    const lib = JSON.stringify(require.resolve('../'));
    const script = `require(${lib})('${svg}')`;

    await promisify(execFile)(cmd, ['-e', script], { cwd: destination });

    await validateIconsDirectory(path.resolve(destination, 'icons'));
  });
});
