const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const dirs = [path.join(__dirname, 'src', 'pages'), path.join(__dirname, 'src', 'utils')];

dirs.forEach(dir => {
  walk(dir, (err, results) => {
    if (err) throw err;
    results.forEach(file => {
      let content = fs.readFileSync(file, 'utf8');
      let changed = false;

      // Fix `useParams<{  }>()`
      if (content.includes('useParams<{  }>()')) {
        content = content.replace(/useParams<\{\s*\}\>\(\)/g, "useParams<{ token: string }>()");
        changed = true;
      }

      // Fix `if (token) fetchXYZ()`
      if (content.match(/if\s*\(!?token\)\s*[a-zA-Z0-9_]+\(\);/)) {
        content = content.replace(/if\s*\(!?token\)\s*[a-zA-Z0-9_]+\(\);/g, "/* token check removed */");
        changed = true;
      }
      
      // Fix `if (!token) return;`
      if (content.includes('if (!token) return;')) {
        content = content.replace(/if\s*\(!token\)\s*return;/g, "");
        changed = true;
      }

      // Fix `if (!isAuthenticated || !token)`
      if (content.includes('if (!isAuthenticated || !token)')) {
        content = content.replace(/if\s*\(!isAuthenticated\s*\|\|\s*!token\)/g, "if (!isAuthenticated)");
        changed = true;
      }

      // Fix `[token, ...]` deps
      if (content.match(/\[token\s*,?/)) {
        content = content.replace(/\[token\s*,?\s*/g, "[");
        changed = true;
      }

      // Fix AdminLogin.tsx `login(token, { ...user })` -> `login({ ...user })`
      if (content.includes('login(token,')) {
        content = content.replace(/login\(\s*token\s*,/g, "login(");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
      }
    });
  });
});
