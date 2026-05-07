import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

const importOrderRule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'enforce project import order',
        },
        schema: [],
        messages: {
            outOfOrder:
                'Import order must be: external packages, aliased imports, type-only imports, then style imports.',
        },
    },
    create(context) {
        function getCategory(node) {
            const source = String(node.source.value ?? '');

            if (node.importKind === 'type') return 2;
            if (/\.(css|scss|sass|less|styl|pcss|postcss)$/.test(source)) return 3;
            if (source.startsWith('@/')) return 1;
            if (source.startsWith('.')) return null;
            return 0;
        }

        return {
            Program(program) {
                const imports = program.body.filter((node) => node.type === 'ImportDeclaration');
                let lastCategory = -1;

                for (const node of imports) {
                    const category = getCategory(node);
                    if (category === null) continue;

                    if (category < lastCategory) {
                        context.report({ node, messageId: 'outOfOrder' });
                        return;
                    }

                    if (category > lastCategory) {
                        lastCategory = category;
                    }
                }
            },
        };
    },
};

export default tseslint.config(
    { ignores: ['dist', 'coverage', 'node_modules', '.claude', '.codex'] },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            project: {
                rules: {
                    'import-order': importOrderRule,
                },
            },
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2020,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always'],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            'project/import-order': 'error',
        },
    },
    {
        files: ['**/*.{js,mjs}'],
        extends: [js.configs.recommended],
        languageOptions: {
            globals: { ...globals.node },
        },
    },
    {
        files: ['config/**/*.ts'],
        rules: {
            'no-console': 'off',
        },
    },
    prettierConfig
);
