#!/usr/bin/env node

const defaults = {
  destination: 'icons',
  include: ['icns', 'ico', 'svg', 'png'],
  'png-sizes': [32, 256, 512]
};

const { destination, include, 'png-sizes': pngSizes, help } = require('getopts')(process.argv.slice(2), {
  alias: {
    help: 'h',
    destination: 'd',
    include: 'i',
    'png-sizes': 's'
  },
  string: ['include', 'pngSizes'],
  default: defaults
});

if (help) {
  // eslint-disable-next-line no-console
  console.log(`
usage:
  svg-app-icon [options] < input.svg

  Options:
    --help             Show help
    --destination, -d  Directory to output icons    [string]   [default: ${defaults.destination}]
    --include, -i      Which icons to create        [string[]] [default: ${defaults.include.join(', ')}]
    --png-sizes, -s    What size png images create  [number[]] [default: ${defaults['png-sizes'].join(', ')}]

  Note: all array arguments can be defined more than once

  Examples:
    svg-app-icon < input.svg
    svg-app-icon --include icns --include ico < input.svg
    cat input.svg | svg-app-icon --destination build/assets
`);
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
