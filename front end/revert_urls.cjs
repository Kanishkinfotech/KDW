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
      
      // We replaced 'http://localhost:5000/api' with '/api'
      // Now we revert: replace '/api' with 'http://localhost:5000/api' for axios and fetch calls
      content = content.replace(/\/api\//g, 'http://localhost:5000/api/');
      
      // Specifically fix endpoints that don't have a trailing slash
      content = content.replace(/'\/api'/g, "'http://localhost:5000/api'");
      content = content.replace(/"\/api"/g, '"http://localhost:5000/api"');
      content = content.replace(/`\/api/g, "`http://localhost:5000/api");

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Reverted URLs in ${fullPath}`);
      }
    }
  }
}

traverseAndReplace(directory);
console.log('Revert complete!');
