import antfu, { type TypedFlatConfigItem } from '@antfu/eslint-config'
import tsParser from '@typescript-eslint/parser'

function config(
  opts: Parameters<typeof antfu>[0] = {},
  ...configs: TypedFlatConfigItem[]
) {
  return antfu(
    {
      type: 'app',
      stylistic: true,
      vue: true,

      ...opts,
    },
    [
      {
        rules: {
          'no-empty-function': 'off',
          'arrow-body-style': ['error', 'as-needed'],

          'eol-last': ['error', 'always'],
          'no-else-return': 'warn',
          'logical-assignment-operators': 'warn',
          'no-implicit-coercion': 'warn',
          'operator-assignment': 'warn',
          'prefer-destructuring': 'warn',
          'prefer-object-has-own': 'warn',
          'no-console': ['warn', { allow: ['debug'] }],
          'no-unused-vars': ['error', { ignoreRestSiblings: true }],
          'no-use-before-define': ['error', { functions: false }],
          'no-param-reassign': ['error', { props: false }],
          'no-underscore-dangle': 'off',
          'no-shadow': 'off',
          'no-unused-expressions': ['error', { allowShortCircuit: true }],
          'no-shadow-restricted-names': 'error',
          'curly': ['error', 'multi-line', 'consistent'],
          'newline-before-return': 'error',
          'newline-per-chained-call': ['error', { ignoreChainWithDepth: 1 }],
          'multiline-ternary': ['error', 'always-multiline'],
          'brace-style': ['error', 'stroustrup'],
          'eqeqeq': ['error', 'smart'],

          'antfu/if-newline': 'error',
          'style/no-confusing-arrow': 'error',
          'style/newline-per-chained-call': 'error',
          'style/wrap-regex': 'error',
          'style/type-named-tuple-spacing': 'error',
          'style/max-statements-per-line': ['error', { max: 80 }],
          'style/array-bracket-newline': ['error', { multiline: true }],

          'import/order': [
            'error',
            {
              'newlines-between': 'always',
              'distinctGroup': true,

              'groups': [
                'builtin',
                'external',
                'object',
                'parent',
                'internal',
                'sibling',
                'index',
                'type',
              ],

              'pathGroups': [
                {
                  pattern: '@/**/*',
                  group: 'internal',
                  position: 'after',
                },
                {
                  pattern: '~/**/*',
                  group: 'internal',
                  position: 'after',
                },
              ],

              'alphabetize': {
                order: 'asc',
                orderImportKind: 'asc',
                caseInsensitive: false,
              },
            },
          ],
        },
      },

      // Typescript
      {
        languageOptions: {
          parser: tsParser,
        },
        files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
        rules: {
          'ts/no-namespace': 'off',
          'ts/explicit-function-return-type': 'off',

          'ts/adjacent-overload-signatures': 'error',
          'ts/array-type': 'error',
          'ts/ban-tslint-comment': 'error',
          'ts/class-literal-property-style': 'error',
          'ts/consistent-generic-constructors': 'error',
          'ts/consistent-indexed-object-style': 'error',
          'ts/consistent-type-assertions': 'error',
          'ts/consistent-type-definitions': 'off',
          'ts/no-confusing-non-null-assertion': 'error',
          'ts/no-empty-function': 'error',
          'ts/no-empty-interface': 'error',
          'ts/no-inferrable-types': 'error',
          'ts/prefer-for-of': 'error',
          'ts/prefer-function-type': 'error',
          'ts/prefer-namespace-keyword': 'error',
        },
      },

      // Unicorn
      {
        rules: {
          'unicorn/better-regex': 'error',
          'unicorn/no-array-for-each': 'error',
          'unicorn/no-array-method-this-argument': 'error',
          'unicorn/no-array-push-push': 'error',
          'unicorn/no-for-loop': 'error',
          'unicorn/no-invalid-remove-event-listener': 'error',
          'unicorn/no-lonely-if': 'error',
          'unicorn/no-negation-in-equality-check': 'error',
          'unicorn/no-nested-ternary': 'error',
          'unicorn/no-static-only-class': 'error',
          'unicorn/no-unreadable-array-destructuring': 'error',
          'unicorn/prefer-number-properties': 'error',
          'unicorn/prefer-optional-catch-binding': 'error',
          'unicorn/text-encoding-identifier-case': 'error',
          'unicorn/catch-error-name': 'error',
          'unicorn/consistent-destructuring': 'error',
          'unicorn/empty-brace-spaces': 'error',
          'unicorn/expiring-todo-comments': 'error',
          'unicorn/no-unnecessary-await': 'error',
          'unicorn/no-useless-undefined': 'error',

          'unicorn/template-indent': ['warn', { indent: 2 }],
        },
      },

      ...configs,
    ],
  )
}

export default config
