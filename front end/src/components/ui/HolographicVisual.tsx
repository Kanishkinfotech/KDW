import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Activity, Layers, ShieldCheck, Cpu } from 'lucide-react';

export default function HolographicVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHoverable, setIsHoverable] = useState(true);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Parallax layers
  const x1 = useTransform(springX, [-0.5, 0.5], [-15, 15]);
  const y1 = useTransform(springY, [-0.5, 0.5], [-15, 15]);
  
  const x2 = useTransform(springX, [-0.5, 0.5], [-30, 30]);
  const y2 = useTransform(springY, [-0.5, 0.5], [-30, 30]);
  
  const x3 = useTransform(springX, [-0.5, 0.5], [-45, 45]);
  const y3 = useTransform(springY, [-0.5, 0.5], [-45, 45]);

  useEffect(() => {
    // Check if device supports hover
    if (window.matchMedia('(hover: none)').matches) {
      setIsHoverable(false);
      return;
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [mouseX, mouseY]);

  // Fallback for non-interactive state
  const mx1 = isHoverable ? x1 : 0;
  const my1 = isHoverable ? y1 : 0;
  const mx2 = isHoverable ? x2 : 0;
  const my2 = isHoverable ? y2 : 0;
  const mx3 = isHoverable ? x3 : 0;
  const my3 = isHoverable ? y3 : 0;

  return (
    <div ref={containerRef} className="relative w-full h-[400px] sm:h-[500px] lg:h-[700px] flex items-center justify-center perspective-[1000px] overflow-visible">
      
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-cyan-500/20 rounded-full blur-[80px] md:blur-[100px] animate-pulse"></div>
        <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-600/20 rounded-full blur-[100px] md:blur-[120px] mix-blend-screen" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
      </div>

      {/* Orbit Rings Layer (Background Parallax) */}
      <motion.div style={{ x: mx1, y: my1 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
           className="w-[250px] h-[250px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] rounded-full border border-cyan-500/10 border-dashed opacity-50"
         />
         <motion.div 
           animate={{ rotate: -360 }}
           transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
           className="absolute w-[350px] h-[350px] md:w-[550px] md:h-[550px] lg:w-[650px] lg:h-[650px] rounded-full border border-blue-500/10 border-dotted opacity-40"
         />
      </motion.div>

      {/* Core AI Visualization */}
      <motion.div 
        style={{ x: mx2, y: my2 }}
        className="relative z-10 flex items-center justify-center pointer-events-none"
      >
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="relative w-24 h-24 md:w-32 md:h-32 lg:w-48 lg:h-48 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl rotate-45 blur-md opacity-40" />
          <div className="absolute inset-1 lg:inset-2 bg-white rounded-2xl rotate-45 border border-cyan-500/40 flex items-center justify-center backdrop-blur-xl shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]">
             <div className="rotate-[-45deg] text-cyan-400">
               <Cpu size={32} strokeWidth={1.5} className="animate-pulse lg:w-12 lg:h-12" />
             </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Glass Cards (Foreground Parallax) */}
      <motion.div style={{ x: mx3, y: my3 }} className="absolute inset-0 pointer-events-none">
        
        {/* Top Left Card - Analytics */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: [-10, 10, -10], opacity: 1 }}
          transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1, delay: 0.2 } }}
          className="absolute top-[5%] left-[5%] md:top-[15%] md:left-[5%] p-3 lg:p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[140px] md:min-w-[180px]"
        >
          <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity size={14} className="lg:w-4 lg:h-4" />
            </div>
            <span className="text-slate-200 text-xs lg:text-sm font-medium">Performance</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl lg:text-2xl font-bold text-slate-900">99.9%</span>
            <span className="text-green-400 text-[10px] lg:text-xs mb-1 font-medium">↑ 2.1%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full mt-2 lg:mt-3 overflow-hidden">
             <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-[99%]" />
          </div>
        </motion.div>

        {/* Bottom Right Card - Code */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: [15, -15, 15], opacity: 1 }}
          transition={{ y: { duration: 7, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1, delay: 0.4 } }}
          className="absolute bottom-[5%] right-[5%] md:bottom-[15%] md:right-[0%] p-3 lg:p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-[160px] md:w-[240px]"
        >
          <div className="flex items-center gap-1.5 lg:gap-2 border-b border-white/5 pb-2 mb-2 lg:mb-3">
            <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-green-500/80" />
            <span className="text-slate-600 text-[10px] lg:text-xs ml-1 lg:ml-2 font-mono">sys.ts</span>
          </div>
          <div className="font-mono text-[10px] md:text-sm space-y-1 md:space-y-1.5">
             <p className="text-blue-400">import <span className="text-slate-200">AI</span> from <span className="text-green-400">'@core'</span>;</p>
             <p className="text-slate-200">const sys = new AI();</p>
             <p className="text-purple-400">await <span className="text-blue-400">sys.init</span>();</p>
          </div>
        </motion.div>

        {/* Middle Right - Components */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ y: [0, 20, 0], opacity: 1 }}
          transition={{ y: { duration: 5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1, delay: 0.6 } }}
          className="absolute top-[35%] md:top-[40%] right-[-5%] md:right-[-10%] lg:right-[5%] p-2 lg:p-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/10 shadow-xl flex items-center gap-2 lg:gap-3"
        >
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
             <Layers size={14} className="lg:w-4 lg:h-4" />
          </div>
          <div>
            <div className="text-slate-900 text-xs lg:text-sm font-semibold">Components</div>
            <div className="text-slate-600 text-[10px] lg:text-xs">250+ Premium</div>
          </div>
        </motion.div>

        {/* Bottom Left - Security */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ y: [-15, 10, -15], opacity: 1, scale: 1 }}
          transition={{ y: { duration: 6.5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1, delay: 0.8 } }}
          className="absolute bottom-[25%] left-[-5%] md:bottom-[25%] md:left-[0%] p-2 lg:p-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/10 shadow-xl flex items-center gap-2 lg:gap-3"
        >
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
             <ShieldCheck size={16} className="lg:w-5 lg:h-5" />
          </div>
          <div>
            <div className="text-slate-900 text-xs lg:text-sm font-semibold">Secure Core</div>
            <div className="text-emerald-400 text-[10px] lg:text-xs flex items-center gap-1"><span className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active</div>
          </div>
        </motion.div>

      </motion.div>

    </div>
  );
}
