import React from 'react';
import SEO from '../components/SEO';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50">
      <SEO title="Cookie Policy | Kanishk Digital World" description="Cookie Policy for Kanishk Digital World." />
      <div className="max-w-4xl mx-auto glass p-8 md:p-12 rounded-3xl border border-slate-200">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Cookie Policy</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600">
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. How We Use Data Storage</h2>
          <p>
            Unlike many other platforms, Kanishk Digital World primarily relies on modern browser storage 
            (such as LocalStorage and SessionStorage) rather than traditional HTTP cookies to run our application.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Essential Storage</h2>
          <p>We use LocalStorage strictly for essential features that make the website function:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Authentication:</strong> Keeping you logged into your account securely using JSON Web Tokens (JWT).</li>
            <li><strong>Shopping Cart:</strong> Remembering the items in your cart and wishlist between sessions.</li>
            <li><strong>Preferences:</strong> Saving temporary UI states (like dark mode or grid views).</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Third-Party Cookies</h2>
          <p>
            When you proceed to checkout, our payment processor (Razorpay) may set their own essential cookies 
            necessary for fraud prevention, transaction security, and processing your payment. We do not control 
            these cookies, and they are governed by Razorpay's privacy policy.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Managing Your Storage</h2>
          <p>
            You can clear your LocalStorage at any time by clearing your browser data or logging out of your account. 
            Note that clearing LocalStorage will empty your shopping cart and log you out of the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
