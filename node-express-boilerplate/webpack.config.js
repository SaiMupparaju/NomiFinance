const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/app.js', // Replace with your main entry file if different
  target: 'node', // Ensures compatibility with Node.js runtime
  externals: [nodeExternals()], // Excludes `node_modules` from the bundle
  output: {
    path: path.resolve(__dirname, '.webpack'), // Output directory
    filename: 'service.js', // Output file
    libraryTarget: 'commonjs2', // Required for AWS Lambda compatibility
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Transpile JavaScript files using Babel
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
};
