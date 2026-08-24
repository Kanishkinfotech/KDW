import { useEffect } from 'react';
import { Book, FileText, ChevronRight, Folder, Home, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import SmartSearch from '../components/support/SmartSearch';
import SEO from '../components/SEO';

export default function KnowledgeBase() {
  const { slug } = useParams<{ slug?: string }>();
  const { supportCategories, supportArticles, fetchSupportCategories, fetchSupportArticles } = useStore();

  useEffect(() => {
    // Ensures data is loaded if they navigated directly here
    if (supportCategories.length === 0) fetchSupportCategories();
    if (supportArticles.length === 0) fetchSupportArticles();
  }, [supportCategories.length, supportArticles.length, fetchSupportCategories, fetchSupportArticles]);

  const selectedCategory = slug ? supportCategories.find(c => c.slug === slug || c.id === slug) : null;
  const categoryArticles = slug 
    ? supportArticles.filter(a => a.categoryId === selectedCategory?.id || (a.category && a.category.slug === slug))
    : supportArticles;

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO 
        title={selectedCategory ? `${selectedCategory.name} | Knowledge Base` : "Knowledge Base | Kanishk Digital World"} 
        description={selectedCategory?.description || "Find answers to all your questions about our products, billing, licenses, and more."} 
      />
      
      {/* Header */}
      <div className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 text-sm font-bold tracking-wide mb-6">
            <Book size={16} className="text-primary" />
            <span>Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8">
            {selectedCategory ? selectedCategory.name : 'Knowledge Base'}
          </h1>
          <SmartSearch />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Category Specific View */}
        {slug ? (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8">
              <Link to="/docs" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home size={16} /> Knowledge Base
              </Link>
              <ChevronRight size={16} />
              <span className="text-slate-900 font-bold">{selectedCategory?.name || slug}</span>
            </div>

            <div className="mb-10 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-3xl font-black text-slate-900 mb-3">{selectedCategory?.name || 'Category Articles'}</h2>
              {selectedCategory?.description && (
                <p className="text-slate-600 font-medium text-lg">{selectedCategory.description}</p>
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              Articles in this Category ({categoryArticles.length})
            </h3>

            {categoryArticles.length > 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {categoryArticles.map((article, idx) => (
                  <Link 
                    key={article.id} 
                    to={`/docs/${article.slug}`}
                    className={`flex justify-between items-center p-6 hover:bg-slate-50 transition-colors group ${idx !== 0 ? 'border-t border-slate-100' : ''}`}
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors mb-1">{article.title}</h4>
                      <p className="text-slate-500 text-sm line-clamp-1 mb-2">{article.content?.substring(0, 120)}...</p>
                      <div className="flex gap-4 text-xs text-slate-400 font-medium">
                        <span>Updated {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}</span>
                        <span>{article.views || 0} views</span>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
                <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-slate-900 mb-2">No articles found</h4>
                <p className="text-slate-500 mb-6">There are currently no articles in this category.</p>
                <Link to="/docs" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                  <ArrowLeft size={16} /> Back to all categories
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* General Knowledge Base Home View */
          <>
            {/* Categories Grid */}
            <div className="mb-16">
              <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Folder className="text-primary" size={32} />
                Categories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supportCategories.map((category) => (
                  <Link 
                    key={category.id} 
                    to={`/docs/category/${category.slug}`}
                    className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-primary hover:shadow-xl transition-all group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{category.name}</h3>
                      <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">{category._count?.articles || 0}</span>
                    </div>
                    {category.description && (
                      <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-2">{category.description}</p>
                    )}
                    
                    {/* Show top 3 articles for this category */}
                    <div className="space-y-3 mt-auto pt-4 border-t border-slate-100">
                      {supportArticles
                        .filter(a => a.categoryId === category.id)
                        .slice(0, 3)
                        .map(article => (
                          <div key={article.id} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors">
                            <FileText size={14} className="text-slate-400" />
                            <span className="truncate">{article.title}</span>
                          </div>
                        ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* All Recent Articles */}
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <FileText className="text-accent" size={32} />
                Latest Articles
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {Array.from(new Map(supportArticles.map(item => [item.id || item.slug, item])).values())
                  .slice(0, 10)
                  .map((article, idx) => (
                  <Link 
                    key={article.id} 
                    to={`/docs/${article.slug}`}
                    className={`flex justify-between items-center p-6 hover:bg-slate-50 transition-colors group ${idx !== 0 ? 'border-t border-slate-100' : ''}`}
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors mb-1">{article.title}</h4>
                      <div className="flex gap-4 text-sm text-slate-500">
                        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{(article.category as any)?.name || 'General'}</span>
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
