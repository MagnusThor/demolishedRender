
module.exports = {
  mode:"development", 
  watch: false,
  entry: {
    "example": './example/Example.js'
  },
  output: {
    path: __dirname + '/example/build',
    filename: '[name]-bundle.js'

  },
  plugins: [
  ],
  module: {
    rules: [
      {
        test: /\.glsl$/i,
        use: 'raw-loader',
      },
    ],
  },
}