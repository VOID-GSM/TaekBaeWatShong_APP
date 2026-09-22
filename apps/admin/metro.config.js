// pnpm 모노레포 설정: https://docs.expo.dev/guides/monorepo/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. 워크스페이스 전체를 watch 해야 packages/* 의 소스 변경이 HMR 에 잡힌다.
config.watchFolders = [workspaceRoot];

// 2. 앱과 워크스페이스 루트의 node_modules 를 모두 해석 대상으로 둔다.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
