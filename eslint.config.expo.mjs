import expoConfig from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

import { coreConfig, ignores } from './eslint.config.base.mjs';

/**
 * Expo / React Native 앱용 설정.
 * import 관련 규칙은 eslint-config-expo 가 이미 들고 있으므로 coreConfig 만 얹는다.
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export const expoLintConfig = tseslint.config(
  ignores,
  ...expoConfig,
  ...coreConfig,
  {
    rules: {
      // 새 JSX 변환에서는 React 를 import 할 필요가 없다.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  prettier,
);

export default expoLintConfig;
