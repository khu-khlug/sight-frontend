import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactQuery from "@tanstack/eslint-plugin-query";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...reactQuery.configs["flat/recommended"],
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    // GroupDetailContainer/WindowLayer/windowManager.ts는 창 상태 전이·물리 배치의 내부
    // 구현이다. WindowLayer 디렉토리 밖에서는 반드시 GroupDetailContainer/actions.ts가
    // 재익스포트하는 것만 쓴다 — actions.ts 자신과 WindowLayer 내부(서로 참조하는 형제
    // 파일들)만 예외로 둔다.
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/features/member/GroupDetailContainer/WindowLayer/**",
      "src/features/member/GroupDetailContainer/actions.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/WindowLayer/windowManager"],
          message: "windowManager를 직접 import할 수 없습니다. ../actions 에서 재익스포트하는 함수/타입을 쓰세요.",
        }],
      }],
    },
  }
);
