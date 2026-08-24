import { Link } from 'react-router-dom';
import { LayoutGrid, AppWindow, Bot, Share2, Briefcase, GraduationCap, Baby, ChevronRight, Hash, Code, Video } from 'lucide-react';
import { useStore } from '../../../store/useStore';

const getIconForCategory = (name: string) => {
  if (name.includes('Business')) return Briefcase;
  if (name.includes('Website')) return AppWindow;
  if (name.includes('AI') || name.includes('ChatGPT') || name.includes('Claude')) return Bot;
  if (name.includes('Social') || name.includes('Instagram')) return Share2;
  if (name.includes('Agency')) return LayoutGrid;
  if (name.includes('Educational')) return GraduationCap;
  if (name.includes('Children')) return Baby;
  if (name.includes('Shorts')) return Video;
  if (name.includes('Code') || name.includes('Automation')) return Code;
  return Hash;
};

export default function MegaMenu({ isOpen }: { isOpen: boolean }) {
  const { categories } = useStore();
  
  if (!isOpen) return null;

  const displayCategories = categories.slice(0, 8);

  return (
    <div className="absolute top-full left-0 w-[600px] mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-6 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {displayCategories.map((cat: any) => {
          const Icon = getIconForCategory(cat.name);
          return (
            <Link 
              key={cat.id} 
              to={`/shop?category=${cat.name}`}
              className="flex items-start gap-4 group rounded-xl p-2 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-1">
                  {cat.name}
                  <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{cat.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100">
        <Link to="/categories" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          View all categories <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
