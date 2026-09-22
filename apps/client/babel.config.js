module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4 의 worklet 변환 플러그인. 반드시 목록의 마지막에 있어야 한다.
      'react-native-worklets/plugin',
    ],
  };
};
