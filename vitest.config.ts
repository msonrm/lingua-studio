import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // レンダラーは AST → 文字列の純関数で DOM に依存しない。
    // dictionary-ext.ts も localStorage をトップレベルで触らない（initDictionaryExt() は明示呼び出し）。
    // そのため node 環境で足りる。コンポーネントテストを足す際は jsdom へ切り替える。
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
});
