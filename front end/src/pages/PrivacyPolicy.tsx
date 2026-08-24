import React from 'react';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50">
      <SEO title="Privacy Policy | Kanishk Digital World" description="Privacy Policy for Kanishk Digital World." />
      <div className="max-w-4xl mx-auto glass p-8 md:p-12 rounded-3xl border border-slate-200">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600">
          <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us when you create an account, 
            make a purchase, subscribe to our newsletter, or submit a support ticket. 
            This includes your name, email address, and order history.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Payment Processing</h2>
          <p>
            All payments are processed securely through Razorpay. We do not store or process your 
            full credit card numbers, UPI PINs, or raw bank details on our servers. Razorpay handles 
            all sensitive payment data subject to their own privacy policies.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Use of Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Process your orders and deliver digital products.</li>
            <li>Provide customer support and respond to your tickets.</li>
            <li>Send order confirmations and important account updates.</li>
            <li>Send newsletters (only if you have explicitly subscribed).</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Cookies and Local Storage</h2>
          <p>
            We use local storage strictly for essential application functionality (such as keeping you logged in 
            and remembering your cart items). We do not use third-party tracking cookies for advertising.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Data Security</h2>
          <p>
            We implement reasonable security measures to protect your personal information. However, no 
            method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at 
            <a href="mailto:support@kdwmarketplace.com" className="text-primary hover:underline ml-1">support@kdwmarketplace.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
