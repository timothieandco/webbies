module.exports = {
  // Basic formatting
  printWidth: 100,
  tabWidth: 4,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // File handling
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  
  // Override settings for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2,
        trailingComma: 'none'
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: '*.css',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.html',
      options: {
        tabWidth: 2,
        printWidth: 120
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2
      }
    }
  ]
};