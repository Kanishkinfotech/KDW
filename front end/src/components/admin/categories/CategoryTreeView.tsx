import { useState } from 'react';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, 
  Edit2, MoveRight, Eye, Trash2, Layers, CheckCircle2, 
  Sparkles, GripVertical, AlertTriangle
} from 'lucide-react';

interface CategoryTreeViewProps {
  categories: any[];
  onAddSubcategory: (parentCat: any) => void;
  onEdit: (cat: any) => void;
  onMove: (cat: any) => void;
  onView: (cat: any) => void;
  onArchive: (cat: any) => void;
}

export default function CategoryTreeView({
  categories,
  onAddSubcategory,
  onEdit,
  onMove,
  onView,
  onArchive
}: CategoryTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build recursive tree
  const categoryMap: Record<string, any> = {};
  categories.forEach(c => {
    categoryMap[c.id] = { ...c, children: [] };
  });

  const rootNodes: any[] = [];
  categories.forEach(c => {
    if (c.parentId && categoryMap[c.parentId]) {
      categoryMap[c.parentId].children.push(categoryMap[c.id]);
    } else {
      rootNodes.push(categoryMap[c.id]);
    }
  });

  const renderNode = (node: any, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center justify-between p-2.5 px-3 rounded-xl hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200 group my-1 ${
            depth > 0 ? 'ml-6' : ''
          }`}
        >
          {/* Left: Expand toggle, Icon, Name */}
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-5" />
            )}

            {hasChildren ? (
              isExpanded ? <FolderOpen size={16} className="text-primary" /> : <Folder size={16} className="text-indigo-500" />
            ) : (
              <Folder size={16} className="text-slate-400" />
            )}

            <span className="font-bold text-xs text-slate-800 truncate">{node.name}</span>

            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              /{node.slug}
            </span>

            {node.featured && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded uppercase">
                <Sparkles size={10} /> Featured
              </span>
            )}
          </div>

          {/* Right: Products Count & Actions */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
              {node.productCount || 0} products
            </span>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                type="button"
                onClick={() => onAddSubcategory(node)}
                title="Add child subcategory"
                className="p-1 text-slate-500 hover:text-primary hover:bg-purple-50 rounded-md"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                onClick={() => onView(node)}
                title="View details"
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md"
              >
                <Eye size={13} />
              </button>
              <button
                type="button"
                onClick={() => onEdit(node)}
                title="Edit category"
                className="p-1 text-slate-500 hover:text-primary hover:bg-purple-50 rounded-md"
              >
                <Edit2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => onMove(node)}
                title="Move parent"
                className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md"
              >
                <MoveRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onArchive(node)}
                title="Archive"
                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-slate-200 ml-4 pl-1 space-y-0.5 my-1">
            {node.children.map((child: any) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">Interactive Category Hierarchy Tree</h3>
          <p className="text-xs text-slate-500">Visual mapping of primary departments and subcategories.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const allExpanded: Record<string, boolean> = {};
              categories.forEach(c => { allExpanded[c.id] = true; });
              setExpandedNodes(allExpanded);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={() => setExpandedNodes({})}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="divide-y divide-slate-100">
        {rootNodes.map(node => renderNode(node))}
      </div>
    </div>
  );
}
