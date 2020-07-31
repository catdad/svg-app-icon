#!/usr/bin/env node

const pkg = require('../package.json');

const defaults = {
  destination: 'icons',
  include: ['icns', 'ico', 'png', 'svg'],
  'png-size': [32, 256, 512]
};

const { destination, include, 'png-size': pngSizes, help, version } = require('getopts')(process.argv.slice(2), {
  alias: {
    version: 'v',
    help: 'h',
    destination: 'd',
    include: 'i',
    'png-size': 's'
  },
  string: ['include'],
  default: defaults
});

if (help) {
  // eslint-disable-next-line no-console
  console.log(`
${pkg.name} v${pkg.version}

Usage:
  ${pkg.name} [options] < input.svg

Options:
  --help             Show help
  --version          Show the version
  --destination, -d  Directory to output icons    [string]   [default: ${defaults.destination}]
  --include, -i      Which icons to create        [string[]] [default: ${defaults.include.join(', ')}]
  --png-size, -s     What size png images create  [number[]] [default: ${defaults['png-size'].join(', ')}]

Note: all array arguments can be defined more than once

Examples:
  ${pkg.name} < input.svg
  ${pkg.name} --include icns --include ico < input.svg
  cat input.svg | ${pkg.name} --destination build/assets
`);
  process.exit(0);
}

if (version) {
  // eslint-disable-next-line no-console
  console.log(pkg.version);
  process.exit(0);
}

const maker = require('../');

const array = v => Array.isArray(v) ? v : [v];

const readStdin = async () => {
  const result = [];

  for await (const chunk of process.stdin) {
    result.push(chunk);
  }

  return Buffer.concat(result);
};

(async () => {
  const input = await readStdin();

  const icns = include.includes('icns');
  const ico = include.includes('ico');
  const png = include.includes('png');
  const svg = include.includes('svg');

  await maker(input, { destination, icns, ico, png, svg, pngSizes: array(pngSizes) });
})().catch(e => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
