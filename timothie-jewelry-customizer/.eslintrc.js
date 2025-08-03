module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    '@eslint/js/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  globals: {
    // Global variables for the jewelry customizer app
    gtag: 'readonly',
    Konva: 'readonly',
  },
  rules: {
    // Error Prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Code Quality
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }],
    'no-undef': 'error',
    'no-redeclare': 'error',
    'no-shadow': 'warn',
    
    // Best Practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'dot-notation': 'error',
    'no-else-return': 'error',
    'no-empty-function': 'warn',
    'no-magic-numbers': ['warn', { 
      ignore: [-1, 0, 1, 2],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true 
    }],
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-useless-return': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // ES6+ Features
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'prefer-destructuring': ['error', {
      array: false,
      object: true
    }],
    
    // Code Style
    'indent': ['error', 4, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    
    // Function Rules
    'function-paren-newline': ['error', 'consistent'],
    'max-params': ['warn', 5],
    'max-statements': ['warn', 50],
    'complexity': ['warn', 15],
    
    // Security Rules
    'no-new-wrappers': 'error',
    'no-constructor-return': 'error',
    'no-prototype-builtins': 'error',
    
    // Async/Await
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    'prefer-async-await': 'off', // Allow both promises and async/await
    
    // Comments
    'spaced-comment': ['error', 'always', {
      line: { markers: ['/', '*'] },
      block: { balanced: true }
    }],
    
    // JSDoc (optional but recommended)
    'valid-jsdoc': ['warn', {
      requireReturn: false,
      requireParamDescription: false,
      requireReturnDescription: false
    }]
  },
  overrides: [
    {
      // Configuration files
      files: ['*.config.js', 'webpack.config.js', '.eslintrc.js'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-magic-numbers': 'off',
        'max-statements': 'off'
      }
    },
    {
      // Legacy browser compatibility files
      files: ['src/js/polyfills/**/*.js'],
      parserOptions: {
        ecmaVersion: 5
      },
      rules: {
        'no-var': 'off',
        'prefer-const': 'off',
        'prefer-arrow-callback': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    'coverage/',
    '*.min.js',
    'src/assets/vendor/'
  ]
};