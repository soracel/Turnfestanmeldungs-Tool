import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import boundaries from './tooling/boundaries.mjs';
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'private-data/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { architecture: { rules: { boundaries } }, 'react-hooks': hooks },
    rules: { 'architecture/boundaries': 'error', ...hooks.configs.recommended.rules },
  },
);
