const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        getFiles(name, files);
      }
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      files.push(name);
    }
  }
  return files;
}

const frontendFiles = getFiles('frontend/src');
const backendFiles = getFiles('src');
const allFiles = [...frontendFiles, ...backendFiles];

let changedCount = 0;
for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/'USD'/g, "'INR'");
  content = content.replace(/"USD"/g, '"INR"');
  content = content.replace(/'en-US'/g, "'en-IN'");
  content = content.replace(/"en-US"/g, '"en-IN"');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Updated ${changedCount} files.`);
