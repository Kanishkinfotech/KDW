const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const outputFilePath = path.join(rootDir, 'project_code_for_notebooklm.md');

// Files and directories to ignore
const ignoreList = [
    'node_modules', '.git', 'dist', 'build', '.env', '.mongo-data', 'mongo-data',
    'package-lock.json', '.gitignore', 'logs', 'public', '.DS_Store',
    'project_code_for_notebooklm.md', 'generate_docs.js'
];
const ignoreExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.mp4', '.pdf', '.zip'
];

let markdownContent = `# Project Codebase Documentation\n\n`;

function shouldIgnore(name, isDir) {
    if (ignoreList.includes(name)) return true;
    if (!isDir) {
        const ext = path.extname(name).toLowerCase();
        if (ignoreExtensions.includes(ext)) return true;
    }
    return false;
}

function generateTree(dirPath, prefix = '') {
    const items = fs.readdirSync(dirPath);
    let treeStr = '';
    
    items.forEach((item, index) => {
        const fullPath = path.join(dirPath, item);
        const isDir = fs.statSync(fullPath).isDirectory();
        
        if (shouldIgnore(item, isDir)) return;
        
        const isLast = index === items.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        treeStr += `${prefix}${connector}${item}\n`;
        
        if (isDir) {
            treeStr += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        }
    });
    
    return treeStr;
}

markdownContent += `## Project Structure\n\`\`\`\n.\n${generateTree(rootDir)}\`\`\`\n\n`;
markdownContent += `## Source Code Files\n\n`;

function appendFiles(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const isDir = fs.statSync(fullPath).isDirectory();
        
        if (shouldIgnore(item, isDir)) continue;
        
        if (isDir) {
            appendFiles(fullPath);
        } else {
            const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const ext = path.extname(item).slice(1) || 'txt';
                markdownContent += `### ${relativePath}\n`;
                markdownContent += `\`\`\`${ext}\n${content}\n\`\`\`\n\n`;
            } catch (err) {
                markdownContent += `### ${relativePath}\n`;
                markdownContent += `*Error reading file or binary file format*\n\n`;
            }
        }
    }
}

appendFiles(rootDir);

fs.writeFileSync(outputFilePath, markdownContent, 'utf8');
console.log(`Documentation generated at: ${outputFilePath}`);
