import React from 'react';
import SEO from '../components/SEO';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50">
      <SEO title="Terms & Conditions | Kanishk Digital World" description="Terms & Conditions for Kanishk Digital World." />
      <div className="max-w-4xl mx-auto glass p-8 md:p-12 rounded-3xl border border-slate-200">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600">
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Kanishk Digital World, you accept and agree to be bound by these Terms and Conditions.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Digital Products</h2>
          <p>
            All products sold on our platform are digital goods. Upon successful payment, you will receive 
            access to download the files immediately via your Dashboard. No physical items will be shipped.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You agree to 
            accept responsibility for all activities that occur under your account. 
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Intellectual Property</h2>
          <p>
            All content, graphics, and digital products on this site are the intellectual property of 
            Kanishk Digital World or their respective creators. Purchasing a product grants you a license 
            to use it, but does not transfer ownership of the intellectual property.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. License Restrictions</h2>
          <p>
            You may not redistribute, resell, or share the raw digital products you purchase from our site, 
            unless explicitly permitted by the specific Commercial License attached to that product.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Limitation of Liability</h2>
          <p>
            Kanishk Digital World shall not be liable for any indirect, incidental, or consequential damages 
            arising out of your use or inability to use our digital products.
          </p>
        </div>
      </div>
    </div>
  );
}
