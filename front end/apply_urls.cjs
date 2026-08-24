const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

function traverseAndReplace(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      traverseAndReplace(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      content = content.replace(/http:\/\/localhost:5000\/api\//g, '/api/');
      content = content.replace(/'http:\/\/localhost:5000\/api'/g, "'/api'");
      content = content.replace(/"http:\/\/localhost:5000\/api"/g, '"/api"');
      content = content.replace(/`http:\/\/localhost:5000\/api/g, "`\/api");

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated URLs in ${fullPath}`);
      }
    }
  }
}

traverseAndReplace(directory);
console.log('Update complete!');
