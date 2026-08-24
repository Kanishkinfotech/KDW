import React from 'react';
import { Shield, Lock, HardDrive, Key, CheckCircle, FileText, Activity, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Security() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50 pb-24">
      <SEO title="Security Architecture | Kanishk Digital World" description="Learn about our payment verification, private product storage, and secure download workflows." />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-6 shadow-sm">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Security Architecture</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            How we protect your payments, secure digital products, and manage access.
          </p>
        </div>

        <div className="space-y-12">
          {/* Payment Protection */}
          <section className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Payment Verification</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Kanishk Digital World does not release a product merely because a customer reaches a payment-success page. Every transaction undergoes strict server-side validation.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                <span>The Razorpay payment signature is cryptographically verified on our backend.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                <span>Razorpay webhook events are validated before purchase entitlements are created.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                <span>Only after successful server-side payment confirmation is product access granted.</span>
              </li>
            </ul>
          </section>

          {/* Private Product Storage */}
          <section className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <HardDrive size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Private Product Storage</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Our digital assets are stored securely in Google Drive. However, we do not use public links.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                <span>All files remain completely restricted in private Google Drive folders.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                <span>Files are never set to "Anyone with the link can view."</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                <span>Our backend acts as the sole authorized layer that communicates with Google Drive APIs.</span>
              </li>
            </ul>
          </section>

          {/* Secure Download Workflow */}
          <section className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Server size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Secure Download Access</h2>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">The Fulfilment Lifecycle</h3>
              <ol className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-200">
                <li className="relative pl-8 text-sm text-slate-700 font-medium">
                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                  Customer completes purchase checkout
                </li>
                <li className="relative pl-8 text-sm text-slate-700 font-medium">
                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                  Backend verifies payment validity
                </li>
                <li className="relative pl-8 text-sm text-slate-700 font-medium">
                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
                  Purchase entitlement is explicitly created
                </li>
                <li className="relative pl-8 text-sm text-slate-700 font-medium">
                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">4</span>
                  Customer requests download via dashboard
                </li>
                <li className="relative pl-8 text-sm text-slate-700 font-medium">
                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">5</span>
                  Backend validates access token and limits
                </li>
                <li className="relative pl-8 text-sm text-slate-700 font-medium">
                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">6</span>
                  File is streamed securely from private storage
                </li>
              </ol>
            </div>
            <p className="text-slate-600 text-sm">
              Customers never see or interact with the underlying Google Drive folder, ensuring the raw files remain protected from unauthorized sharing.
            </p>
          </section>

          {/* Account Security & Tokens */}
          <section className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Key size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Access Tokens & Limits</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><CheckCircle size={16} className="text-success" /> Revocable Tokens</h3>
                <p className="text-sm text-slate-600 mb-4">Download links are temporary access tokens associated with a specific purchase. They do not expose permanent Drive links.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><CheckCircle size={16} className="text-success" /> Download Limits</h3>
                <p className="text-sm text-slate-600 mb-4">Initial downloads are capped at 5 successful attempts. Failed downloads do not consume this limit.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><CheckCircle size={16} className="text-success" /> Download Logging</h3>
                <p className="text-sm text-slate-600 mb-4">Every file download attempt is logged in our database to monitor for suspicious activity or abuse.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><CheckCircle size={16} className="text-success" /> Access Revocation</h3>
                <p className="text-sm text-slate-600 mb-4">If an order is refunded or charged back, the associated access tokens are instantly invalidated.</p>
              </div>
            </div>
          </section>

          <div className="mt-12 text-center p-8 bg-primary/5 rounded-3xl text-slate-900 border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">Security Contact</h3>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto">
              If you have discovered a security vulnerability or have questions about our data practices, please contact us immediately.
            </p>
            <Link to="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Contact Support Team
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
