'use client';

import React from 'react';
import { Check } from 'lucide-react';

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

interface EvaluationStepperProps {
  currentStep: StepNumber;
  onStepClick: (step: StepNumber) => void;
  maxStepUnlocked: StepNumber;
}

export const EvaluationStepper: React.FC<EvaluationStepperProps> = ({
  currentStep,
  onStepClick,
  maxStepUnlocked,
}) => {
  const steps: { number: StepNumber; label: string }[] = [
    { number: 1, label: 'Instrument' },
    { number: 2, label: 'Test Setup' },
    { number: 3, label: 'Test Plan' },
    { number: 4, label: 'Testing' },
    { number: 5, label: 'Review' },
    { number: 6, label: 'Report' },
  ];

  return (
    <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 shadow-2xs">
      <div className="max-w-5xl mx-auto">
        <nav aria-label="Evaluation Workflow Progress">
          <ol className="flex items-center justify-between overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {steps.map((step, idx) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              const isClickable = step.number <= maxStepUnlocked;

              return (
                <li key={step.number} className="relative flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => isClickable && onStepClick(step.number)}
                    disabled={!isClickable}
                    className={`flex items-center gap-2 text-xs transition-colors py-1 px-1.5 rounded ${
                      isClickable ? 'cursor-pointer hover:bg-slate-50' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-700 text-white shadow-xs ring-2 ring-blue-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-300'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                    </span>
                    <span
                      className={`text-xs font-medium hidden sm:inline whitespace-nowrap ${
                        isCurrent
                          ? 'text-blue-900 font-bold'
                          : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>

                  {idx < steps.length - 1 && (
                    <div
                      className={`w-6 sm:w-10 lg:w-16 h-0.5 mx-1.5 hidden sm:block transition-colors ${
                        currentStep > step.number ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
