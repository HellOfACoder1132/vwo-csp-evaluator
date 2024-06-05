const path = require('path');

module.exports = {
  entry: './src/index.ts', // Entry point of your package
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Target TypeScript and optional JSX files
        use: 'ts-loader', // Use ts-loader for TypeScript transpilation
        exclude: /node_modules/, // Exclude node_modules directory
      },
    ],
  },
  mode: "production",
  resolve: {
    extensions: ['.tsx', '.ts', '.js'], // Allow resolving TypeScript and JavaScript files
  },
  output: {
    filename: 'index.js', // Output filename for the bundled package
    path: path.resolve(__dirname, 'dist'), // Output directory for the bundled package
    library: { // Define the library name for consumption
      type: 'commonjs2', // Universal Module Definition format
      name: 'analyzeCSP', // Replace with your actual package name
      export: 'default', // Export the default export of your entry point
    },
  },
};
