import taekbaeExpoConfig from '../../eslint.config.expo.mjs';

export default [
  ...taekbaeExpoConfig,
  {
    ignores: ['.expo/**', 'expo-env.d.ts', 'android/**', 'ios/**', 'coverage/**'],
  },
];
