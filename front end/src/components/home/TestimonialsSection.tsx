import { Star, CheckCircle2, MessageSquare } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function TestimonialsSection() {
  const { activeTestimonials } = useStore();
  
  if (!activeTestimonials || activeTestimonials.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Loved by Creators
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            Join thousands of satisfied customers who use our premium digital resources to work smarter and faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeTestimonials.slice(0, 3).map((testimonial: any) => (
            <div key={testimonial.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full hover:-translate-y-1 hover:shadow-md transition-all">
              <div className="flex gap-1 mb-6 text-amber-400">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-lg leading-relaxed flex-grow mb-8 font-medium">
                "{testimonial.review}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                {testimonial.image ? (
                  <img src={testimonial.image} alt={testimonial.customerName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                    {testimonial.customerName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900">{testimonial.customerName}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    {testimonial.company ? (
                      <span>{testimonial.designation ? `${testimonial.designation}, ` : ''}{testimonial.company}</span>
                    ) : (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-500" /> Verified Purchase
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
