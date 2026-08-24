import { Link } from 'react-router-dom';
import { ArrowRight, Layout, Bot, Image, Share2, Cpu, Code2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function CategoryGrid() {
  const { categories } = useStore();

  const defaultCategories = [
    { name: 'Website Kits', icon: <Layout className="text-blue-500" size={28} />, desc: 'Ready-to-launch website templates and UI kits.' },
    { name: 'AI Prompt Bundles', icon: <Bot className="text-purple-500" size={28} />, desc: 'Curated prompts for Midjourney, ChatGPT & Claude.' },
    { name: 'Graphic Assets', icon: <Image className="text-emerald-500" size={28} />, desc: 'High-res textures, mockups, vector packs and overlays.' },
    { name: 'Social Media Bundles', icon: <Share2 className="text-pink-500" size={28} />, desc: 'Canva templates, reels packs, and story designs.' },
    { name: 'Automation Tools', icon: <Cpu className="text-amber-500" size={28} />, desc: 'Make, Zapier & Python workflow automations.' },
    { name: 'Code Templates', icon: <Code2 className="text-indigo-500" size={28} />, desc: 'Full-stack boilerplates, Next.js & React starters.' }
  ];

  return (
    <section className="py-20 bg-slate-50/60 border-t border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-black tracking-widest text-primary uppercase mb-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 inline-block">
              EXPLORE CATALOG
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Browse Popular Categories
            </h2>
            <p className="text-slate-600 text-base mt-1 max-w-xl font-medium">
              Discover curated collections designed for creators, developers, agency owners, and digital entrepreneurs.
            </p>
          </div>
          <Link 
            to="/categories" 
            className="text-primary font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all shrink-0"
          >
            All Categories <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {defaultCategories.map((cat, idx) => {
            const dbMatch = categories?.find((c: any) => c.name.toLowerCase() === cat.name.toLowerCase());
            const productCount = dbMatch ? (dbMatch._count?.products || 12) : 12;

            return (
              <Link 
                key={idx}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                      {productCount}+ Assets
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-primary font-bold text-xs flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  Browse {cat.name} <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
