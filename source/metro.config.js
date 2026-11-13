const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * The original app (source/) resolved these via Metro's Haste module map
 * (a package.json with just {"name": "@alias"} in each app subfolder).
 * That no longer resolves on this Metro version, so aliases are declared
 * explicitly here instead. Keep this list in sync with the old project's
 * per-folder package.json "name" fields when porting more aliases over.
 */
const aliases = {
  '@actions': 'app/actions',
  '@api': 'app/api',
  '@assets': 'app/assets',
  '@components': 'app/components',
  '@config': 'app/config',
  '@models': 'app/models',
  '@reducers': 'app/reducers',
  '@sagas': 'app/sagas',
  '@screens': 'app/screens',
  '@selectors': 'app/selectors',
  '@services': 'app/services',
  '@store': 'app/store',
  '@utils': 'app/utils',
  app: 'app',
};

const aliasRoots = Object.fromEntries(
  Object.entries(aliases).map(([alias, dir]) => [
    alias,
    path.resolve(__dirname, dir),
  ]),
);

/**
 * extraNodeModules alone only matches a bare alias (e.g. '@spike'), not an
 * alias with a subpath (e.g. '@screens/Loading' or 'app/navigation/main') —
 * Metro treats the latter as a distinct scoped-package name, not a prefix.
 * A custom resolveRequest handles both forms the same way Haste used to.
 */
function resolveRequest(context, moduleName, platform) {
  for (const [alias, dir] of Object.entries(aliasRoots)) {
    if (moduleName === alias || moduleName.startsWith(alias + '/')) {
      const target = dir + moduleName.slice(alias.length);
      return context.resolveRequest(context, target, platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
