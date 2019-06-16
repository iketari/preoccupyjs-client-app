const path = require('path');

module.exports = {
  entry: './src/index.bookmarklet.ts',
  mode: 'production',
  module: {
    rules: [
      { 
        test: /\.tsx?$/, 
        loader: 'awesome-typescript-loader',
        options: {
          configFileName: 'bookmarklet.tsconfig.json'
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    alias: {
      './assets/bookmarklet.bundle': path.resolve(__dirname, './../src/assets/bookmarklet.bundle.stub')
    }
  },
  output: {
    filename: 'bookmarklet.bundle',
    path: path.resolve(__dirname, '../src/assets')
  }
};

