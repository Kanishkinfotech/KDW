import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import SEO from '../components/SEO';
import { blogPosts } from '../data/blogData';
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import ProductCard from '../components/ProductCard';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products } = useStore();
  
  const post = blogPosts.find(p => p.slug === slug);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post && post.relatedProductSlugs && products.length > 0) {
      const related = products.filter(p => post.relatedProductSlugs?.includes(p.slug));
      setRelatedProducts(related);
    }
  }, [post, products]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Article Not Found</h1>
        <Link to="/blog" className="text-primary font-bold hover:underline">Return to Blog</Link>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO title={`${post.title} | KDW Blog`} description={post.excerpt} />
      
      {/* Article Header */}
      <div className="bg-white pt-32 pb-24 px-6 text-center border-b border-slate-200">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Blog
          </Link>
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded-md uppercase tracking-wider">
              {post.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-8 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-slate-500 text-sm font-medium">
            <span className="flex items-center gap-2"><Calendar size={18} /> {new Date(post.publishedDate).toLocaleDateString()}</span>
            <span className="flex items-center gap-2"><Clock size={18} /> {post.readingTime}</span>
            <span className="hidden md:inline">By {post.author}</span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="aspect-[21/9] w-full">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
          
          <div className="p-8 md:p-12">
            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-primary hover:prose-a:text-primary/80">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            {/* Share and Tags */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
              <div className="font-bold text-slate-900">
                Category: <span className="text-primary">{post.category}</span>
              </div>
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
                <Share2 size={18} /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900">Products Mentioned</h2>
            <p className="text-slate-600 mt-2">Ready-to-use resources to help you implement these strategies.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
