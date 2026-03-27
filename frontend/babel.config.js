module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',      // 코드에서 import할 이름
        path: '.env',            // 읽어올 파일 위치
      },
    ],
  ],
};