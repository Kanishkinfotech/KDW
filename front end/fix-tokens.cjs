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

      // Replace destructuring `token` from `useAuth`
      const useAuthRegex = /const\s+\{([^}]*)token([^}]*)\}\s*=\s*useAuth\(\);/g;
      if (useAuthRegex.test(content)) {
        content = content.replace(useAuthRegex, (match, p1, p2) => {
          let inner = (p1 + p2).split(',').map(s => s.trim()).filter(Boolean).join(', ');
          return inner ? `const { ${inner} } = useAuth();` : `const {} = useAuth();`;
        });
        changed = true;
      }

      // Remove `if (!token) { return }` blocks completely
      const tokenIfRegex = /if\s*\(!token\)\s*\{[\s\S]*?\}/g;
      if (tokenIfRegex.test(content)) {
        content = content.replace(tokenIfRegex, '');
        changed = true;
      }

      // Replace `[token]` or `[token, x]` in useEffect deps
      if (content.includes('[token, logout]')) {
        content = content.replace(/\[token, logout\]/g, '[logout]');
        changed = true;
      }
      if (content.includes('[token, user]')) {
        content = content.replace(/\[token, user\]/g, '[user]');
        changed = true;
      }
      if (content.includes('[token]')) {
        content = content.replace(/\[token\]/g, '[]');
        changed = true;
      }
      if (content.includes('[user, token]')) {
        content = content.replace(/\[user, token\]/g, '[user]');
        changed = true;
      }
      if (content.includes('[activeTab, token]')) {
        content = content.replace(/\[activeTab, token\]/g, '[activeTab]');
        changed = true;
      }

      // Replace headers
      if (content.includes("headers: { 'Authorization': `Bearer ${token}` }")) {
        content = content.replace(/headers: \{ 'Authorization': `Bearer \$\{token\}` \}/g, "headers: { 'Content-Type': 'application/json' }");
        changed = true;
      }
      if (content.includes("const headers = { 'Authorization': `Bearer ${token}` };")) {
        content = content.replace(/const headers = \{ 'Authorization': `Bearer \$\{token\}` \};/g, "const headers = { 'Content-Type': 'application/json' };");
        changed = true;
      }
      
      // utils api
      if (content.includes("`Bearer ${token}`")) {
         content = content.replace(/`Bearer \$\{token\}`/g, "''");
         changed = true;
      }
      if (content.includes("Authorization: `Bearer")) {
         content = content.replace(/'?Authorization'?: `Bearer \$\{token\}`/g, "");
         changed = true;
      }
      if (content.match(/token\s*:\s*string/)) {
         content = content.replace(/token\s*:\s*string,?/g, "");
         changed = true;
      }

      if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
      }
    });
  });
});
