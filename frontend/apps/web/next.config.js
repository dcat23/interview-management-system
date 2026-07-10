//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  // pino relies on runtime require()/worker-thread transport loading and
  // shared internal Symbols; bundling it breaks that (e.g. "Cannot read
  // properties of undefined (reading 'stringifySym')").
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
