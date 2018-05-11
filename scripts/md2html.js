// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

const showdown = require('showdown');
const path = require('path');
const { readFileSync, writeFileSync } = require('fs');

const currentDir = path.resolve(__dirname);
const mdFileList = [
  {
    key: 'README',
    in: currentDir + '/../README.md',
    template: currentDir + '/../template/index.html',
    out: currentDir + '/../index.html'
  },
  {
    key: 'CHANGELOG',
    in: currentDir + '/../CHANGELOG.md',
    template: currentDir + '/../template/changelog.html',
    out: currentDir + '/../changelog.html'
  }
];

function getReadmeRest(html) {
  const htmlSplit = html.split('\n');
  const result = [];
  let h2Found = false;
  let i, line;

  for (i = 0; i < htmlSplit.length; i++) {
    line = htmlSplit[i];

    if (h2Found === false && line.indexOf('<h2') !== -1) {
      h2Found = true;
    }

    if (h2Found) {
      result.push(line);
    }
  }

  return result.join('\n');
}

function getReadmeFirstSection(html) {
  const htmlSplit = html.split('\n');
  const result = [];
  let i, line;

  for (i = 0; i < htmlSplit.length; i++) {
    line = htmlSplit[i];

    if (i === 0) {
      continue;
    }
    if (line.indexOf('<h2') !== -1) {
      break;
    }

    result.push(line);
  }

  return result.join('\n');
}

function insertIntoFile(template, content, contentFirstSection) {
  const lineList = template.split('\n');
  const result = [];

  lineList.forEach((templateLine) => {
    if (templateLine.indexOf('<!-- insert HTML code here - first section -->') !== -1) {
      contentFirstSection.split('\n').forEach((line) => {
        result.push(line);
      });
    } else if (templateLine.indexOf('<!-- insert HTML code here -->') !== -1) {
      content.split('\n').forEach((line) => {
        result.push(line);
      });
    } else {
      result.push(templateLine);
    }
  });

  return result.join('\n');
}

function main() {
  let converter, markdown, html, template, finalContent;

  converter = new showdown.Converter();

  mdFileList.forEach((mdFile) => {
    markdown = readFileSync(mdFile.in, 'utf8');
    html = converter.makeHtml(markdown);
    template = readFileSync(mdFile.template, 'utf8');

    switch (mdFile.key) {
      case 'README':
        htmlRest = getReadmeRest(html);
        htmlFirstSection = getReadmeFirstSection(html);
        finalContent = insertIntoFile(template, htmlRest, htmlFirstSection);
        break;
      default:
        finalContent = insertIntoFile(template, html);
    }

    writeFileSync(mdFile.out, finalContent, 'utf8');
  })
}

main();
