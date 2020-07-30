const { promises: fs } = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const { expect } = require('chai');
const tempy = require('tempy');
const del = require('del');

const pkg = require('../package.json');
const binPath = path.resolve(__dirname, '..', pkg.bin);
const { validateIcons, svg, png, type } = require('./helpers');

const read = async stream => {
  const content = [];

  for await (const chunk of stream) {
    content.push(chunk);
  }

  return Buffer.concat(content).toString();
};

const once = (ee, name) => new Promise(resolve => {
  ee.once(name, arg => resolve(arg));
});

const run = async (cwd, args = []) => {
  const proc = spawn(process.execPath, [binPath, ...args], {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let err;

  proc.on('error', e => {
    err = e;
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    once(proc, 'exit'),
    read(proc.stdout),
    read(proc.stderr),
    (() => proc.stdin.end(svg))()
  ]);

  if (err) {
    throw err;
  }

  return { exitCode, stdout, stderr };
};

describe('app-icon-maker CLI', () => {
  let destination;

  afterEach(async () => {
    if (destination) {
      await del(destination, { force: true });
    }

    destination = null;
  });

  it('generates all icons by default usign svg string', async () => {
    destination = tempy.directory();

    await run(destination);

    await validateIcons(path.resolve(destination, 'icons'));
  });

  it('optionally outputs to a custom destination', async () => {
    destination = tempy.directory();

    await run(destination, ['--destination', 'a/b/c']);

    await validateIcons(path.resolve(destination, 'a/b/c'));
  });

  for (let include of ['icns', 'ico', 'png', 'svg']) {
    it(`can optionally include only ${include} output`, async () => {
      destination = tempy.directory();

      await run(destination, ['--include', include]);

      const expected = {
        icns: include === 'icns',
        ico: include === 'ico',
        png: include === 'png',
        svg: include === 'svg',
      };

      await validateIcons(path.resolve(destination, 'icons'), { ...expected });
    });
  }

  it('can optionally include multiple formats', async () => {
    destination = tempy.directory();

    await run(destination, ['--include', 'ico', '--include', 'svg', '-i', 'png']);

    const expected = {
      icns: false,
      ico: true,
      png: true,
      svg: true
    };

    await validateIcons(path.resolve(destination, 'icons'), { ...expected });
  });

  it('can optionally generate a single arbitrary png size', async () => {
    destination = tempy.directory();
    const size = 291;

    await run(destination, ['-i', 'png', '--png-size', size]);

    const outdir = path.resolve(destination, 'icons');

    const actualFiles = await fs.readdir(outdir);

    expect(actualFiles.sort()).to.deep.equal([
      `${size}x${size}.png`
    ].sort());

    const buffer = await fs.readFile(path.resolve(outdir, `${size}x${size}.png`));
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth } = png.read(buffer);

    expect(width).to.equal(size);
    expect(height).to.equal(size);
    expect(depth).to.equal(8);
  });

  it('can optionally generate multiple arbitrary png sizes', async () => {
    destination = tempy.directory();
    const pngSizes = [47, 345, 1000];

    await run(destination, ['-i', 'png', '--png-size', pngSizes[0], '--png-size', pngSizes[1], '-s', pngSizes[2]]);

    const outdir = path.resolve(destination, 'icons');

    const actualFiles = await fs.readdir(outdir);

    expect(actualFiles.sort()).to.deep.equal([
      '47x47.png',
      '345x345.png',
      '1000x1000.png'
    ].sort());

    for (let size of pngSizes) {
      const buffer = await fs.readFile(path.resolve(outdir, `${size}x${size}.png`));
      expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
      const { width, height, depth } = png.read(buffer);

      expect(width).to.equal(size);
      expect(height).to.equal(size);
      expect(depth).to.equal(8);
    }
  });

  it('exits with an error if something goes wrong', async () => {
    destination = tempy.directory();

    const { exitCode, stderr } = await run(destination, ['-i', 'png', '--png-size', 'pineapples']);

    expect(exitCode).to.equal(1);
    expect(stderr).to.be.a('string').and.to.include('Error:');
  });

  it('prints help when the --help flag is included', async () => {
    const { stdout, stderr } = await run(__dirname, ['--help']);

    expect(stdout).to.be.a('string')
      .and.to.include('Usage:')
      .and.to.include('Options:')
      .and.to.include('Examples:');

    expect(stderr.trim()).to.equal('');
  });
});
