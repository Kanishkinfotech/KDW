import React from 'react';
import SEO from '../components/SEO';

export default function LicensePolicy() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50">
      <SEO title="License Policy | Kanishk Digital World" description="License Policy for Kanishk Digital World." />
      <div className="max-w-4xl mx-auto glass p-8 md:p-12 rounded-3xl border border-slate-200">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">License Policy</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600">
          <p>
            When you purchase a product from Kanishk Digital World, you are purchasing a license to use the 
            digital asset, not the ownership of the asset itself. Below are the definitions of our license types.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Personal License</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Permitted:</strong> Use in one personal, non-commercial project.</li>
            <li><strong>Prohibited:</strong> Use in client work, commercial end-products, or any project that generates revenue.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Standard (Commercial) License</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Permitted:</strong> Use in one commercial project for yourself or a client. You may charge your client for the final project.</li>
            <li><strong>Prohibited:</strong> Reselling or redistributing the raw template/files, or allowing the end user to extract the raw asset.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Extended License</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Permitted:</strong> Use in multiple commercial projects, SaaS applications, or products where end-users are charged.</li>
            <li><strong>Prohibited:</strong> Reselling the item "as-is" in a competing marketplace or bundling it to redistribute as a template.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. General Restrictions</h2>
          <p>Under NO license type may you:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Claim the original design or code as your own.</li>
            <li>Resell the product exactly as you downloaded it.</li>
            <li>Share your downloaded files on public repositories or torrent sites.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
