const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WrapperPlugin = require('wrapper-webpack-plugin');
const { readFileSync } = require('fs');
const packageJson = require('./package.json');
const packageName = packageJson.name;
const libraryName = getLibraryName(packageName);
const versionFileContent = readFileSync(path.resolve(__dirname) + '/src/version.ts', 'utf8');
const version = getVersion(versionFileContent);
const licence = readFileSync(path.resolve(__dirname) + '/LICENCE');

function getLibraryName(packageName) {
  return packageName
    .toLowerCase()
    .split('-')
    .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join('');
}

function getVersion(versionFileContent) {
  const patternStart = '= \'';

  return versionFileContent.substring(
    versionFileContent.indexOf(patternStart) + patternStart.length,
    versionFileContent.indexOf('\';')
  );
}

function getConfig(env) {
  return {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts','.js']
    },
    output: {
      filename: '[name].js',
      library: libraryName,
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'dist')
    },
    plugins: [
      new webpack.DefinePlugin({
        DEVELOPMENT: JSON.stringify(env.DEVELOPMENT === true),
        PRODUCTION: JSON.stringify(env.PRODUCTION === true)
      }),
      new WrapperPlugin({
        header: '/*\n' + licence + '*/\n\n'
      })
    ]
  };
}

function fillDev(config) {
  config.entry = {
    [`${packageName}-v${version}`]: './src/index.ts'
  };

  config.devtool = 'inline-source-map';

  config.devServer = {
    contentBase: path.resolve(__dirname),
    publicPath: '/dist/',
    compress: true,
    port: 8000,
    hot: false,
    openPage: 'example/index.html',
    overlay: {
      warnings: true,
      errors: true
    }
  };
}

function fillProd(config) {
  config.entry = {
    [`${packageName}-v${version}`]: './src/index.ts',
    [`${packageName}-v${version}.min`]: './src/index.ts',
  };

  config.devtool = 'source-map';

  config.plugins.unshift(
    new UglifyJsPlugin({
      include: /\.min\.js$/,
      sourceMap: true
    })
  );
}

module.exports = (env) => {
  const config = getConfig(env);

  if (env.DEVELOPMENT === true) {
    fillDev(config);
  } else if (env.PRODUCTION === true) {
    fillProd(config);
  } else {
    throw 'Please set the environment!';
  }

  return config;
}
