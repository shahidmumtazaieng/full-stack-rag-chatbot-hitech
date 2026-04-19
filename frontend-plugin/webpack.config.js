const path = require('path');

module.exports = {
  entry: './widget.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.widget.json'
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'widget.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'HitechChatWidget',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};