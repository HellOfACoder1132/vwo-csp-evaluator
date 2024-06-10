const path = require('path');

const baseConfig = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'analyzeCSP', // The name of your library
      type: 'umd', // Universal Module Definition, works in CommonJS and AMD environments
    },
    globalObject: 'this', // Ensures compatibility with Node.js environment
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'production',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

module.exports = baseConfig;
