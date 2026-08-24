const fs = require('fs');

function removeUnused(file, replacements) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(file, content);
}

removeUnused('src/main.tsx', [
    [/(error): Error/g, '_error: Error'],
    [/(errorInfo): React.ErrorInfo/g, '_errorInfo: React.ErrorInfo']
]);

removeUnused('src/pages/admin/AdminCustomers.tsx', [
    [/MoreVertical,\s*/g, ''],
    [/const \[users, setUsers\] = useState/g, 'const [users] = useState']
]);

removeUnused('src/pages/admin/AdminOrders.tsx', [
    [/const \[orders, setOrders\] = useState/g, 'const [orders] = useState']
]);

removeUnused('src/pages/admin/AdminProductForm.tsx', [
    [/,\s*Settings/g, '']
]);

removeUnused('src/pages/admin/AdminProducts.tsx', [
    [/MoreVertical,\s*/g, '']
]);

removeUnused('src/pages/Bundles.tsx', [
    [/,\s*Download,\s*Check/g, ''],
    [/import { Link, useNavigate } from 'react-router-dom';/, "import { useNavigate } from 'react-router-dom';"]
]);

removeUnused('src/store/useStore.ts', [
    [/persist\(\(set, get\)/, 'persist((set)']
]);
