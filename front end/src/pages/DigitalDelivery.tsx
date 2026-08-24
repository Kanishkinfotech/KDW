import React from 'react';
import SEO from '../components/SEO';

export default function DigitalDelivery() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50">
      <SEO title="Digital Delivery | Kanishk Digital World" description="Digital Delivery process for Kanishk Digital World." />
      <div className="max-w-4xl mx-auto glass p-8 md:p-12 rounded-3xl border border-slate-200">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Digital Delivery</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600">
          <p>
            Kanishk Digital World is a 100% digital marketplace. No physical products will be shipped to you.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Instant Access</h2>
          <p>
            Upon successful payment verification via Razorpay, your order is instantly created. You will immediately 
            gain access to download your purchased files from the order confirmation page.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Accessing Your Downloads Later</h2>
          <p>
            You can access all your purchased files at any time by logging into your account and navigating to 
            <strong> Dashboard &gt; Downloads</strong> or <strong>Dashboard &gt; My Purchases</strong>.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Failed Deliveries</h2>
          <p>
            If your payment was deducted but you cannot see the download link in your dashboard:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Wait a few minutes as payment gateways sometimes have slight delays.</li>
            <li>Check your email (including spam folder) for the order confirmation.</li>
            <li>If the issue persists, please <a href="/support/ticket" className="text-primary hover:underline">raise a ticket</a> with your payment transaction ID.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. File Formats</h2>
          <p>
            Most products are delivered as ZIP archives, PDF documents, or direct Google Drive links. Ensure you have 
            the appropriate software (like WinRAR, 7-Zip, or a PDF reader) to extract and view the files.
          </p>
        </div>
      </div>
    </div>
  );
}
