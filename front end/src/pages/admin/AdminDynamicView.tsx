import { useParams } from 'react-router-dom';
import DynamicAdminTable from '../../components/admin/DynamicAdminTable';
import { adminTableConfig } from '../../data/adminTableConfig';
export default function AdminDynamicView() {
  const { section } = useParams<{ section: string }>();

  // Look up the configuration for this section
  const config = section ? adminTableConfig[section] : null;

  // If the section doesn't exist in our config, redirect to dashboard or show 404
  if (!config) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h2>
        <p className="text-slate-500 mb-6">The admin section "{section}" does not exist or is under construction.</p>
      </div>
    );
  }

  return <DynamicAdminTable config={config} />;
}
