import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import HolographicVisual from './HolographicVisual';

// Character-by-character animation variants
const sentenceVariant = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.05,
    },
  },
};

const letterVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 },
  },
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function HeroSection() {
  const headlineWords = ["Build Smarter.", "Launch Faster.", "Powered by AI."];

  return (
    <section className="relative w-full min-h-screen bg-slate-50 overflow-hidden flex items-center pt-20 pb-10">
      
      {/* Subtle Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      
      {/* Aurora Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-purple-900/20 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-120px)]">
          
          {/* Left Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left mt-10 lg:mt-0">
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/50 border border-slate-200/50 backdrop-blur-md mb-8"
            >
              <Sparkles size={16} className="text-cyan-400" />
              <span className="text-slate-200 text-sm font-medium tracking-wide">
                ✨ Trusted by Developers & Startups Worldwide
              </span>
            </motion.div>

            <motion.h1 
              variants={sentenceVariant}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6 flex flex-col gap-2"
            >
              {headlineWords.map((word, i) => (
                <span 
                  key={i} 
                  className={i === 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-cyan-400" : "text-slate-900"}
                >
                  {word.split('').map((char, index) => (
                    <motion.span key={index} variants={letterVariant} className="inline-block">
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </span>
              ))}
            </motion.h1>

            <motion.p 
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.8 }}
              className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl"
            >
              Create professional websites, UI components, dashboards, AI tools, and business solutions with intelligent automation—all in one platform.
            </motion.p>

            <motion.div 
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link 
                to="/shop" 
                className="group relative px-8 py-4 rounded-xl bg-white text-slate-900 font-bold overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Explore Products</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                className="px-8 py-4 rounded-xl bg-slate-100/50 hover:bg-slate-100 text-slate-900 font-semibold backdrop-blur-md border border-slate-200 transition-all hover:border-slate-600 flex items-center justify-center gap-2"
              >
                <Play size={18} className="text-cyan-400" />
                Watch Demo
              </button>
            </motion.div>

            {/* Statistics */}
            <motion.div 
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 1.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full pt-8 border-t border-slate-200"
            >
              <div>
                <div className="text-2xl font-bold text-slate-900 mb-1">10,000+</div>
                <div className="text-sm text-slate-600">Developers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 mb-1">250+</div>
                <div className="text-sm text-slate-600">Premium Components</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 mb-1">99.9%</div>
                <div className="text-sm text-slate-600">Performance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 mb-1">24/7</div>
                <div className="text-sm text-slate-600">Support</div>
              </div>
            </motion.div>

            {/* Trust Logos */}
            <motion.div 
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 1.4 }}
              className="mt-12 flex flex-col gap-4"
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Powered by world-class tech</span>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                 {/* Pseudo-logos using text for now, could be replaced with actual SVG icons */}
                 <span className="text-slate-700 font-bold text-lg">React</span>
                 <span className="text-slate-700 font-bold text-lg">TypeScript</span>
                 <span className="text-slate-700 font-bold text-lg">TailwindCSS</span>
                 <span className="text-slate-700 font-bold text-lg">Framer Motion</span>
                 <span className="text-slate-700 font-bold text-lg">OpenAI</span>
                 <span className="text-slate-700 font-bold text-lg">Razorpay</span>
              </div>
            </motion.div>

          </div>

          {/* Right Content - 3D Visual */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-full h-full flex items-center justify-center"
          >
             <HolographicVisual />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
