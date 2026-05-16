import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Stepper({
  children,
  stepTitles = [],
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = '← Previous',
  nextButtonText = 'Next →',
  ...rest
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const goTo = (n) => {
    if (n < 1 || n > totalSteps) return;
    setDirection(n > currentStep ? 1 : -1);
    setCurrentStep(n);
    onStepChange(n);
  };

  const handleNext = () => {
    if (isLastStep) { setDirection(1); setCurrentStep(totalSteps + 1); onFinalStepCompleted(); }
    else goTo(currentStep + 1);
  };

  const handleBack = () => goTo(currentStep - 1);

  const progressPct = Math.min(((currentStep - 1) / (totalSteps - 1)) * 100, 100);

  return (
    <div className="w-full" {...rest}>
      {/* ── Tab row ── */}
      <div className="relative">
        {/* Thin progress track */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0a0a0a]/10" />
        <motion.div
          className="absolute top-0 left-0 h-[2px] bg-[#0a0a0a]"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        />

        <div className="flex border-b border-[#0a0a0a]/12">
          {stepsArray.map((_, i) => {
            const n = i + 1;
            const isActive = currentStep === n;
            const isDone = currentStep > n;
            return (
              <button
                key={n}
                onClick={() => goTo(n)}
                className={`flex-1 pt-7 pb-5 px-5 md:px-8 text-left border-r border-[#0a0a0a]/10 last:border-r-0 transition-colors ${
                  !isActive && !isDone ? 'hover:bg-[#0a0a0a]/[0.03]' : ''
                }`}
              >
                <div className={`mono text-[9px] uppercase tracking-[0.35em] mb-2.5 transition-colors ${
                  isDone ? 'text-[#e63946]' : isActive ? 'text-[#0a0a0a]/50' : 'text-[#0a0a0a]/25'
                }`}>
                  {isDone ? '✓ complete' : `step ${String(n).padStart(2, '0')}`}
                </div>
                <div className={`display font-black leading-none transition-colors ${
                  isActive ? 'text-[#0a0a0a] text-3xl md:text-4xl' : isDone ? 'text-[#0a0a0a]/40 text-2xl md:text-3xl' : 'text-[#0a0a0a]/20 text-2xl md:text-3xl'
                }`}>
                  {stepTitles[i] || `Step ${n}`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step content ── */}
      {!isCompleted ? (
        <>
          <StepContentWrapper currentStep={currentStep} direction={direction}>
            {stepsArray[currentStep - 1]}
          </StepContentWrapper>

          <div className={`mt-10 pt-6 border-t border-[#0a0a0a]/10 flex items-center ${currentStep !== 1 ? 'justify-between' : 'justify-end'}`}>
            {currentStep !== 1 && (
              <button
                onClick={handleBack}
                className="mono text-[10px] uppercase tracking-widest text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition"
              >
                {backButtonText}
              </button>
            )}
            <button
              onClick={handleNext}
              className="mono text-[10px] uppercase tracking-widest bg-[#0a0a0a] text-[#efe8d8] px-7 py-3 hover:bg-[#e63946] transition"
            >
              {isLastStep ? 'Done ✓' : nextButtonText}
            </button>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-12"
        >
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#0a0a0a]/40">All steps complete.</div>
        </motion.div>
      )}
    </div>
  );
}

function StepContentWrapper({ currentStep, direction, children }) {
  const [height, setHeight] = useState('auto');

  return (
    <motion.div style={{ overflow: 'hidden' }} animate={{ height }} transition={{ type: 'spring', duration: 0.4 }}>
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        <SlideTransition key={currentStep} direction={direction} onHeight={setHeight}>
          {children}
        </SlideTransition>
      </AnimatePresence>
    </motion.div>
  );
}

function SlideTransition({ children, direction, onHeight }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (ref.current) onHeight(ref.current.offsetHeight);
  }, [children, onHeight]);

  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={{
        enter: d => ({ x: d >= 0 ? '-30%' : '30%', opacity: 0 }),
        center: { x: '0%', opacity: 1 },
        exit:  d => ({ x: d >= 0 ? '20%' : '-20%', opacity: 0 }),
      }}
      initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Step({ children }) {
  return <div className="py-10 md:py-14">{children}</div>;
}
