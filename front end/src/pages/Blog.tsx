import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { blogPosts, blogCategories } from '../data/blogData';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const filteredPosts = activeCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  const featuredPost = blogPosts[0];
  const remainingPosts = filteredPosts.filter(post => post.id !== featuredPost.id || activeCategory !== 'All');

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <SEO title="KDW Blog | Kanishk Digital World" description="Insights on business, productivity, and digital products." />
      
      {/* Blog Hero & Featured Article */}
      <div className="bg-white pt-32 pb-16 px-6 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6">Our Blog</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Insights, tutorials, and strategies to help you Create More and Achieve More with digital products.
            </p>
          </div>

          {activeCategory === 'All' && featuredPost && (
            <Link to={`/blog/${featuredPost.slug}`} className="block group">
              <div className="relative rounded-3xl overflow-hidden aspect-[21/9] md:aspect-[21/7] bg-slate-100 border border-slate-200 shadow-sm">
                <img src={featuredPost.coverImage} alt={featuredPost.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent/20"></div>
                <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-3xl">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md mb-4">{featuredPost.category}</span>
                  <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 group-hover:text-primary transition-colors">{featuredPost.title}</h2>
                  <p className="text-slate-600 md:text-lg mb-6 line-clamp-2">{featuredPost.excerpt}</p>
                  <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                    <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(featuredPost.publishedDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={16} /> {featuredPost.readingTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Categories & Latest Articles */}
      <div className="max-w-7xl mx-auto px-6 mt-16">
        
        {/* Categories */}
        <div className="flex overflow-x-auto gap-3 pb-4 mb-12 hide-scrollbar">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeCategory === 'All' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-200'}`}
          >
            All Articles
          </button>
          {blogCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {remainingPosts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
              <div className="aspect-video overflow-hidden relative">
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur text-slate-900 text-xs font-bold rounded-md">{post.category}</span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-slate-500 text-xs font-medium mb-3">
                  <span>{new Date(post.publishedDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{post.readingTime}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">{post.excerpt}</p>
                <div className="mt-auto flex items-center text-primary font-bold text-sm">
                  Read Article <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-600">Check back later for more content in this category.</p>
            <button onClick={() => setActiveCategory('All')} className="mt-6 text-primary font-bold hover:underline">View all articles</button>
          </div>
        )}

      </div>
    </div>
  );
}
