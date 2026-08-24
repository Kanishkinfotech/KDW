import React from 'react';
import { Eye, Keyboard, Layout, Smartphone, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Accessibility() {
  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50 pb-24">
      <SEO title="Accessibility | Kanishk Digital World" description="Our commitment to digital accessibility for all customers." />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-6 shadow-sm">
            <Eye size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Accessibility</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Kanishk Digital World is committed to making our marketplace usable, readable, and navigable for everyone.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Accessibility Features</h2>
            <p className="text-slate-600 mb-10 leading-relaxed">
              We continually review our platform against modern web accessibility guidelines. Here are the active measures we have implemented across the KDW storefront:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="mt-1 shrink-0 text-primary"><Keyboard size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Keyboard Navigation</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    All interactive elements, including product cards, checkout flows, and dashboard menus, are reachable and actionable using the Tab and Enter/Space keys. We provide visible focus states so you know where you are.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 shrink-0 text-primary"><Eye size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Color Contrast & Legibility</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    We maintain sufficient color contrast ratios between text and background colors. We use modern, readable typography (Inter/Sans-serif) with appropriate line heights.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 shrink-0 text-primary"><Layout size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Semantic Structure</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Pages are built with proper HTML5 semantics and structured heading levels (H1, H2, H3) to ensure screen readers can accurately interpret the layout and content flow.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 shrink-0 text-primary"><Smartphone size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Responsive Design</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    The interface automatically scales and adapts to mobile devices and tablets. Text remains readable when zoomed up to 200% without horizontal scrolling.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Additional Considerations</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle size={16} className="text-success" /> Alternative text provided for all meaningful product images.</li>
                <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle size={16} className="text-success" /> Form inputs have explicitly associated labels and error messages.</li>
                <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle size={16} className="text-success" /> Buttons and links have descriptive text conveying their purpose.</li>
                <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle size={16} className="text-success" /> No reliance on color alone to convey critical status or errors.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-8 md:p-12 rounded-3xl text-center border border-primary/20 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Accessibility Support</h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            If you experience difficulty accessing any part of Kanishk Digital World, please contact our support team and describe the issue. We are committed to making it right.
          </p>
          <Link to="/contact" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
            Contact Support
          </Link>
        </div>

      </div>
    </div>
  );
}
