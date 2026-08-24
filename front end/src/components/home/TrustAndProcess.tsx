import { Download, ShieldCheck, Zap, HeartHandshake } from 'lucide-react';

export default function TrustAndProcess() {
  const processSteps = [
    { num: '01', title: 'Choose' },
    { num: '02', title: 'Pay Securely' },
    { num: '03', title: 'Get Access' },
    { num: '04', title: 'Start Using' }
  ];

  const trustFeatures = [
    { icon: <Download size={20} className="text-primary" />, text: 'Instant Digital Access' },
    { icon: <ShieldCheck size={20} className="text-primary" />, text: 'Secure Payment' },
    { icon: <Zap size={20} className="text-primary" />, text: 'Clear Product Information' },
    { icon: <HeartHandshake size={20} className="text-primary" />, text: 'Customer Support' }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Why Choose Us (Trust) */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Shop With Us?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trustFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      {feature.icon}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works (Process) */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
              <div className="flex flex-col sm:flex-row gap-4 relative">
                {/* Desktop Connecting Line */}
                <div className="hidden sm:block absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
                
                {processSteps.map((step, idx) => (
                  <div key={idx} className="relative z-10 flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-row sm:flex-col items-center gap-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-primary font-black flex items-center justify-center text-sm shrink-0 border-2 border-white shadow-sm">
                      {step.num}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
