import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowRight, LayoutGrid, Target, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const location = useLocation();

  return (
    <nav className="hidden lg:flex items-center gap-1">
      <NavLink to="/home" label="Home" currentPath={location.pathname} />
      
      {/* Categories Mega Menu */}
      <CategoriesDropdown currentPath={location.pathname} />

      <NavLink to="/bundles" label="Bundles" currentPath={location.pathname} />
      <NavLink to="/support" label="Support" currentPath={location.pathname} />
    </nav>
  );
}

function NavLink({ to, label, currentPath }: { to: string, label: string, currentPath: string }) {
  const isActive = currentPath === to || (to !== '/home' && currentPath.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all group ${isActive ? 'text-primary' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
    >
      {label}
      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary transition-all duration-300 rounded-full ${isActive ? 'w-4' : 'w-0 group-hover:w-4 opacity-0 group-hover:opacity-100'}`}></span>
    </Link>
  );
}

function CategoriesDropdown({ currentPath }: { currentPath: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = currentPath.startsWith('/categories');

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        to="/categories"
        className={`flex items-center gap-1 relative px-4 py-2 rounded-full text-sm font-semibold transition-all group ${isActive ? 'text-primary' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
      >
        Categories
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary transition-all duration-300 rounded-full ${isActive ? 'w-4' : 'w-0 group-hover:w-4 opacity-0 group-hover:opacity-100'}`}></span>
      </Link>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-[600px] z-50"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
              
              {/* Top Banner */}
              <div className="bg-slate-50 p-4 border-b border-slate-100">
                <Link 
                  to="/categories/all-products" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                      <PackageSearch size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">SHOP ALL PRODUCTS</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">Browse our complete collection</div>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Main Content Grid */}
              <div className="p-6 grid grid-cols-2 gap-8">
                
                {/* Browse Categories */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <LayoutGrid size={14} /> BROWSE CATEGORIES
                  </h4>
                  <ul className="space-y-2">
                    {[
                      { name: 'Instagram Bundles', slug: 'instagram-bundles' },
                      { name: 'Agency Kits', slug: 'agency-kits' },
                      { name: 'Social Media Bundles', slug: 'social-media-bundles' },
                      { name: 'AI Prompt Bundles', slug: 'ai-prompt-bundles' },
                      { name: 'Website Kits', slug: 'website-kits' },
                      { name: 'Automation', slug: 'automation' },
                      { name: 'Business Templates', slug: 'business-templates' },
                      { name: 'Healthcare', slug: 'healthcare' },
                    ].map(cat => (
                      <li key={cat.slug}>
                        <Link 
                          to={`/categories/${cat.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all py-1"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Shop by Goal */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Target size={14} /> SHOP BY GOAL
                  </h4>
                  <ul className="space-y-3">
                    {[
                      { name: 'Start a Business', slug: 'business-templates', desc: 'Business & Agency tools' },
                      { name: 'Grow Social Media', slug: 'social-media-bundles', desc: 'Instagram & Social kits' },
                      { name: 'Automate Work', slug: 'automation', desc: 'Automation & AI prompts' },
                      { name: 'Build a Website', slug: 'website-kits', desc: 'Website & UI templates' },
                    ].map(goal => (
                      <li key={goal.name}>
                        <Link 
                          to={`/categories/${goal.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="group block p-3 -ml-3 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <div className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{goal.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{goal.desc}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* View Hub CTA */}
              <div className="bg-slate-900 p-4 text-center">
                <Link 
                  to="/categories" 
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-semibold text-white hover:text-primary-light transition-colors inline-flex items-center gap-1"
                >
                  Explore Categories Hub <ArrowRight size={14} />
                </Link>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
