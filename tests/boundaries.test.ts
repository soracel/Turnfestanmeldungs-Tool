import { ESLint } from 'eslint';
import { expect, it } from 'vitest';
const eslint = new ESLint();
it('rejects reversed relative and alias dependencies including type-only imports', async () => {
  for (const source of [
    '../../presentation/app/context',
    '@/presentation/app/context',
    'react',
    '../../infrastructure/csv/papa-parser',
  ]) {
    const [result] = await eslint.lintText(
      `import type { Unknown } from '${source}'; export type Test = Unknown;`,
      { filePath: 'src/domain/registration/probe.ts' },
    );
    expect(result.messages.some((message) => message.ruleId === 'architecture/boundaries')).toBe(
      true,
    );
  }
});
it('permits application dependencies on the domain', async () => {
  const [result] = await eslint.lintText(
    "import type { Registration } from '../../domain/registration/model'; export type Test = Registration;",
    { filePath: 'src/application/session/probe.ts' },
  );
  expect(result.errorCount).toBe(0);
});
