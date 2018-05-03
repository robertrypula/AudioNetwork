const showdown = require('showdown');
const path = require('path');
const { readFileSync, writeFileSync } = require('fs');

const currentDir = path.resolve(__dirname);
const mdFilePathList = [
  {
    in: currentDir + '/../README.md',
    out: currentDir + '/index.html'
  },
  {
    in: currentDir + '/../CHANGELOG.md',
    out: currentDir + '/changelog.html'
  },
  {
    in: currentDir + '/../INTERNET-SOURCES.md',
    out: currentDir + '/internet-sources.html'
  }
];

function main() {
  let converter, markdown, html;

  converter = new showdown.Converter();

  mdFilePathList.forEach((mdFilePath) => {
    markdown = readFileSync(mdFilePath.in, 'utf8');
    html = converter.makeHtml(markdown);
    writeFileSync(mdFilePath.out, html, 'utf8');
  })
}

main();
