const { promises: fs } = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const { expect } = require('chai');
const tempy = require('tempy');
const del = require('del');
const type = require('file-type');
const { sync: png } = require('pngjs').PNG;

const maker = require('../');

const svg = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="pink"/></svg>';

const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

const validators = {
  'icon.icns': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'icns', mime: 'image/icns' });
  },
  'icon.ico': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'ico', mime: 'image/x-icon' });
  },
  '32x32.png': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(32);
    expect(height).to.equal(32);
    expect(depth).to.equal(8);

    expect(hash(data), '32x32.png has different pixels').to.equal('84983735a5aa163aed058191c920e4b87831227182a9d800b0d0796c54d9635d');
  },
  '256x256.png': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(256);
    expect(height).to.equal(256);
    expect(depth).to.equal(8);

    expect(hash(data), '256x256.png has different pixels').to.equal('4db3b3bbfa792b966042487401d098e0ff6e477f32620020ff43c57e5ad1fa8b');
  },
  '512x512.png': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(512);
    expect(height).to.equal(512);
    expect(depth).to.equal(8);

    expect(hash(data), '512x512.png has different pixels').to.equal('4314abee99d494ab7a6675107fb5005c7a17367c3800a9b980ce207b1334cb36');
  },
  'icon.svg': async (buffer) => {
    expect(buffer.toString()).to.equal(svg);
  }
};

describe('app-icon-maker', () => {
  let destination;

  const validateIcons = async (dir, { icns = true, ico = true, png = true, svg = true } = {}) => {
    const expectedFiles = []
      .concat(icns ? ['icon.icns'] : [])
      .concat(ico ? ['icon.ico'] : [])
      .concat(png ? ['32x32.png', '256x256.png', '512x512.png'] : [])
      .concat(svg ? ['icon.svg'] : []);

    const actualFiles = await fs.readdir(dir);

    expect(actualFiles.sort()).to.deep.equal(expectedFiles.sort());

    for (let file of expectedFiles) {
      await validators[file](await fs.readFile(path.resolve(dir, file)));
    }
  };

  afterEach(async () => {
    if (destination) {
      await del(destination, { force: true });
    }

    destination = null;
  });

  it('generates all icons by default usign svg string', async () => {
    destination = tempy.directory();

    await maker(svg, { destination });

    await validateIcons(destination);
  });

  it('generates all icons by default usign svg buffer', async () => {
    destination = tempy.directory();

    await maker(Buffer.from(svg), { destination });

    await validateIcons(destination);
  });

  it('will create the output directory if it does not exisst', async () => {
    destination = tempy.directory();

    const exists = p => fs.access(p).then(() => true).catch(() => false);
    const outdir = path.resolve(destination, 'a/b/c/d');

    expect(await exists(outdir)).to.equal(false);

    await maker(svg, { destination: outdir });

    expect(await exists(outdir)).to.equal(true);
    await validateIcons(outdir);
  });

  for (let exclude of ['icns', 'ico', 'png', 'svg']) {
    it(`can optionally skip ${exclude} output`, async () => {
      destination = tempy.directory();

      await maker(svg, { destination, [exclude]: false });

      await validateIcons(destination, { [exclude]: false });
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

  it('places all icons in "icons" directory when no options are provided', async function () {
    this.timeout(this.timeout() * 2);

    destination = tempy.directory();
    const cmd = process.execPath;
    const lib = JSON.stringify(require.resolve('../'));
    const script = `require(${lib})('${svg}')`;

    await promisify(execFile)(cmd, ['-e', script], { cwd: destination });

    await validateIcons(path.resolve(destination, 'icons'));
  });
});
