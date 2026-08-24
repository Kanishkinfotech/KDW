import React from 'react';
import SEO from '../components/SEO';

export default function About() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50">
      <SEO title="About Us | Kanishk Digital World" description="Learn more about Kanishk Digital World." />
      <div className="max-w-4xl mx-auto glass p-8 md:p-12 rounded-3xl border border-slate-200">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">About Us</h1>
        
        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-primary">
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            Welcome to <strong>Kanishk Digital World</strong>, the premium marketplace for digital assets, 
            website templates, automation workflows, UI kits, and AI resources. 
          </p>

          <h3 className="text-2xl font-bold mt-10 mb-4">Our Mission</h3>
          <p className="text-slate-600 mb-6">
            We serve digital creators, agencies, developers, and businesses by providing high-quality 
            digital products designed to accelerate their workflows. We believe in a digital-first economy 
            where high-quality resources should be accessible, well-documented, and ready for production.
          </p>

          <h3 className="text-2xl font-bold mt-10 mb-4">What We Offer</h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-6">
            <li><strong>Website Kits:</strong> Fully responsive, production-ready website templates.</li>
            <li><strong>Business Templates:</strong> Professional documents and frameworks.</li>
            <li><strong>Automation:</strong> Ready-to-use workflows and scripts.</li>
            <li><strong>AI Resources:</strong> Curated prompt bundles and AI integration guides.</li>
          </ul>

          <h3 className="text-2xl font-bold mt-10 mb-4">Our Commitment</h3>
          <p className="text-slate-600">
            Every product on our marketplace undergoes strict quality checks. We are committed to 
            providing excellent customer support, clear documentation, and transparent licensing for 
            everything we sell.
          </p>
        </div>
      </div>
    </div>
  );
}
