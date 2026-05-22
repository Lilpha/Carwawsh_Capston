const fs = require('fs');
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
/** 기본 설정만 사용 — Windows에서 unstable_workerThreads 켜면 번들이 0%에서 오래 멈추는 경우가 있음 */
const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      // Windows + 비ASCII 경로(OneDrive\바탕 화면 등)에서 react-is ./cjs/* 상대 경로 해석 실패 우회
      if (
        moduleName.startsWith('./cjs/react-is.') &&
        context.originModulePath.includes(`${path.sep}react-is${path.sep}index.js`)
      ) {
        const filePath = path.resolve(
          path.dirname(context.originModulePath),
          moduleName,
        );
        if (fs.existsSync(filePath)) {
          return { type: 'sourceFile', filePath };
        }
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
