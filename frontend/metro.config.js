const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
/** 기본 설정만 사용 — Windows에서 unstable_workerThreads 켜면 번들이 0%에서 오래 멈추는 경우가 있음 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
