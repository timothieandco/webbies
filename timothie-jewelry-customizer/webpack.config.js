const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;
  
  return {
    entry: {
      // Split entries for better code splitting
      main: './src/js/main-modular.js',
      home: './src/js/home.js',
      browse: './src/js/browse-simple.js',
      product: './src/js/product.js',
      checkout: './src/js/checkout.js',
      'order-confirmation': './src/js/order-confirmation.js',
      
      // Vendor chunks
      vendor: ['konva', '@supabase/supabase-js'],
      
      // Testing utilities (only in development)
      ...(isDevelopment && {
        'test-suite': './src/js/utils/TestSuite.js',
        'performance-monitor': './src/js/utils/PerformanceMonitor.js'
      })
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].bundle.js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      assetModuleFilename: 'assets/[name].[contenthash][ext]',
      clean: true,
      publicPath: '/',
    },
    
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
            },
            mangle: {
              reserved: ['CartManager', 'PerformanceMonitor', 'AccessibilityAuditor']
            }
          },
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
              },
            ],
          },
        }),
      ],
      
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          
          // Common utilities
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
          
          // Modular architecture core (highest priority)
          architecture: {
            test: /[\\/]src[\\/]js[\\/](core|config|utils)[\\/](FeatureDetector|AppConfig|EventBus|ErrorBoundary|LazyLoader|ServiceFactory)/,
            name: 'architecture',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
            enforce: true,
          },
          
          // Cart management (shared across pages)
          cart: {
            test: /[\\/]src[\\/]js[\\/](core|services)[\\/](CartManager|MockCartManager|CartAPI|InventoryAPI)/,
            name: 'cart',
            chunks: 'all',
            priority: 8,
            reuseExistingChunk: true,
          },
          
          // Inventory services
          inventory: {
            test: /[\\/]src[\\/]js[\\/]services[\\/](InventoryService|LocalInventoryService)/,
            name: 'inventory',
            chunks: 'all',
            priority: 7,
            reuseExistingChunk: true,
          },
          
          // Testing utilities (development only)
          testing: {
            test: /[\\/]src[\\/]js[\\/]utils[\\/](TestSuite|PerformanceMonitor|AccessibilityAuditor|IntegrationTester|CartManagerTester)/,
            name: 'testing',
            chunks: 'all',
            priority: 6,
            reuseExistingChunk: true,
          },
          
          // CSS
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      
      // Runtime chunk for better caching
      runtimeChunk: 'single',
      
      // Module concatenation
      concatenateModules: isProduction,
      
      // Tree shaking
      usedExports: true,
      sideEffects: false,
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not dead']
                  },
                  modules: false, // Let webpack handle modules
                  useBuiltIns: 'usage',
                  corejs: 3
                }]
              ],
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                ...(isProduction ? [
                  ['transform-remove-console', { exclude: ['error', 'warn'] }]
                ] : [])
              ]
            }
          }
        },
        
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: isDevelopment,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['autoprefixer'],
                    ...(isProduction ? [['cssnano']] : [])
                  ],
                },
                sourceMap: isDevelopment,
              },
            },
          ],
        },
        
        {
          test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[contenthash][ext]'
          },
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb - inline small images
            },
          },
        },
        
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[contenthash][ext]'
          },
        },
      ],
    },
    
    plugins: [
      // Extract CSS in production
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash].css',
          chunkFilename: 'css/[name].[contenthash].chunk.css',
        })
      ] : []),
      
      // HTML pages with optimized chunks
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        chunks: ['runtime', 'vendors', 'architecture', 'common', 'cart', 'inventory', 'main'],
        title: 'Timothie & Co Jewelry Customizer',
        minify: isProduction && {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      
      new HtmlWebpackPlugin({
        template: './src/home.html',
        filename: 'home.html',
        chunks: ['runtime', 'vendors', 'common', 'home'],
        title: 'Timothie & Co - Craft Your Story, One Charm at a Time',
        minify: isProduction && {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      
      new HtmlWebpackPlugin({
        template: './src/browse.html',
        filename: 'browse.html',
        chunks: ['runtime', 'vendors', 'architecture', 'common', 'cart', 'inventory', 'browse'],
        title: 'Browse Jewelry - Timothie & Co',
        minify: isProduction && {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      
      new HtmlWebpackPlugin({
        template: './src/product.html',
        filename: 'product.html',
        chunks: ['runtime', 'vendors', 'architecture', 'common', 'cart', 'inventory', 'product'],
        title: 'Product Details - Timothie & Co',
        minify: isProduction && {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      
      new HtmlWebpackPlugin({
        template: './src/checkout.html',
        filename: 'checkout.html',
        chunks: ['runtime', 'vendors', 'architecture', 'common', 'cart', 'checkout'],
        title: 'Checkout - Timothie & Co',
        minify: isProduction && {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      
      new HtmlWebpackPlugin({
        template: './src/order-confirmation.html',
        filename: 'order-confirmation.html',
        chunks: ['runtime', 'vendors', 'common', 'order-confirmation'],
        title: 'Order Confirmation - Timothie & Co',
        minify: isProduction && {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      
      // Test suite page (development only)
      ...(isDevelopment ? [
        new HtmlWebpackPlugin({
          template: './src/test-suite.html',
          filename: 'test-suite.html',
          chunks: ['runtime', 'vendors', 'common', 'testing', 'test-suite'],
          title: 'Test Suite - Timothie & Co',
        })
      ] : []),
      
      // Compression for production
      ...(isProduction ? [
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8,
        })
      ] : []),
      
      // Bundle analyzer (when needed)
      ...(process.env.ANALYZE === 'true' ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html',
        })
      ] : []),
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@js': path.resolve(__dirname, 'src/js'),
        '@css': path.resolve(__dirname, 'src/css'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@components': path.resolve(__dirname, 'src/js/components'),
        '@core': path.resolve(__dirname, 'src/js/core'),
        '@services': path.resolve(__dirname, 'src/js/services'),
        '@utils': path.resolve(__dirname, 'src/js/utils'),
      },
      extensions: ['.js', '.jsx', '.json'],
    },
    
    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: isProduction ? 250000 : 500000, // 250kb in production
      maxAssetSize: isProduction ? 250000 : 500000,
    },
    
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
          publicPath: '/',
        },
        {
          directory: path.join(__dirname, 'src'),
          publicPath: '/',
        }
      ],
      compress: true,
      hot: true,
      open: 'home.html',
      port: 3000,
      historyApiFallback: {
        rewrites: [
          { from: /^\/home/, to: '/home.html' },
          { from: /^\/browse/, to: '/browse.html' },
          { from: /^\/product/, to: '/product.html' },
          { from: /^\/checkout/, to: '/checkout.html' },
          { from: /^\/order-confirmation/, to: '/order-confirmation.html' },
          { from: /^\/test-suite/, to: '/test-suite.html' },
          { from: /./, to: '/index.html' }
        ]
      },
      headers: {
        'Cache-Control': 'no-store',
      },
    },
    
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    
    // Environment-specific settings
    mode: isProduction ? 'production' : 'development',
    
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    },
  };
};