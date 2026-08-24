import React from 'react';
import SEO from '../components/SEO';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50">
      <SEO title="Refund Policy | Kanishk Digital World" description="Refund Policy for Kanishk Digital World." />
      <div className="max-w-4xl mx-auto glass p-8 md:p-12 rounded-3xl border border-slate-200">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Refund Policy</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600">
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Digital Products Nature</h2>
          <p>
            Because Kanishk Digital World offers irrevocable, non-tangible digital goods, we generally 
            do not provide refunds once an order is completed and the product download link is issued. 
            By purchasing, you acknowledge the digital nature of the products.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Eligibility for Refunds</h2>
          <p>We may grant a refund under the following strict conditions:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Non-Delivery:</strong> If due to a system error, you do not receive the product link and our support team cannot fix it.</li>
            <li><strong>Major Defects:</strong> If a product is completely broken, corrupted, or unusable, and our technical support cannot resolve the issue.</li>
            <li><strong>Duplicate Purchase:</strong> If you accidentally purchased the exact same item twice within a 24-hour period.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Non-Refundable Circumstances</h2>
          <p>We will NOT provide refunds for:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>"I changed my mind" or "I bought it by mistake".</li>
            <li>Lack of technical skills to use the template or code.</li>
            <li>Incompatibility with third-party software not mentioned in the product description.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Requesting a Refund</h2>
          <p>
            To request a refund under the eligible criteria, please <a href="/support/ticket" className="text-primary hover:underline">raise a ticket</a> within 
            7 days of purchase. Please include your order ID and a detailed explanation of the issue.
          </p>
        </div>
      </div>
    </div>
  );
}
