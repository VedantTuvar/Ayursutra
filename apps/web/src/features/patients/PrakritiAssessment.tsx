import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/axios';
import { useSaveAssessment } from './usePatients';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { ArrowLeft, ArrowRight, Save, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: number;
  category: 'Physical' | 'Mental' | 'Digestive' | 'Lifestyle';
  text: string;
  options: {
    label: string;
    dosha: 'VATA' | 'PITTA' | 'KAPHA';
  }[];
}

const QUESTIONS: Question[] = [
  // 1. Physical
  {
    id: 1,
    category: 'Physical',
    text: 'What is your body frame and skeletal build?',
    options: [
      { label: 'Thin, light-boned, tall or very short, skeletal outlines prominent', dosha: 'VATA' },
      { label: 'Medium build, muscular, well-proportioned, athletic', dosha: 'PITTA' },
      { label: 'Large, broad-chested, heavy build, tends to gain weight easily', dosha: 'KAPHA' }
    ]
  },
  {
    id: 2,
    category: 'Physical',
    text: 'What is your natural skin texture and temperature?',
    options: [
      { label: 'Dry, rough, thin, cold to the touch, veins visible', dosha: 'VATA' },
      { label: 'Warm, soft, oily, reddish/pinkish complexion, prone to freckles/acne', dosha: 'PITTA' },
      { label: 'Thick, smooth, oily, cool to the touch, fair or pale complexion', dosha: 'KAPHA' }
    ]
  },
  {
    id: 3,
    category: 'Physical',
    text: 'What is your natural hair type?',
    options: [
      { label: 'Dry, curly, thin, brittle, dark/dull', dosha: 'VATA' },
      { label: 'Straight, fine, soft, blond/red/brown, prone to early graying/balding', dosha: 'PITTA' },
      { label: 'Thick, wavy, oily, strong, abundant, lustrous', dosha: 'KAPHA' }
    ]
  },
  {
    id: 4,
    category: 'Physical',
    text: 'What is your physical activity rate and movements speed?',
    options: [
      { label: 'Fast, erratic, hyperactive, walks quickly, fidgety', dosha: 'VATA' },
      { label: 'Moderate, purposeful, competitive, walks with medium stride', dosha: 'PITTA' },
      { label: 'Slow, steady, deliberate, walks gracefully and slowly', dosha: 'KAPHA' }
    ]
  },
  {
    id: 5,
    category: 'Physical',
    text: 'Describe your natural sleep pattern.',
    options: [
      { label: 'Light, interrupted, fitful, easily disturbed, prone to insomnia', dosha: 'VATA' },
      { label: 'Moderate, wakes up occasionally but falls back asleep, averages 6-7 hours', dosha: 'PITTA' },
      { label: 'Heavy, deep, long, sleeps 8-10 hours easily, finds it hard to wake up', dosha: 'KAPHA' }
    ]
  },

  // 2. Mental
  {
    id: 6,
    category: 'Mental',
    text: 'What is your speech style?',
    options: [
      { label: 'Fast, talkative, high-pitched, skips from one topic to another', dosha: 'VATA' },
      { label: 'Sharp, concise, loud, argumentative or highly persuasive', dosha: 'PITTA' },
      { label: 'Slow, sweet, melodious, quiet, speaks only when necessary', dosha: 'KAPHA' }
    ]
  },
  {
    id: 7,
    category: 'Mental',
    text: 'How does your memory operate?',
    options: [
      { label: 'Learns quickly but forgets quickly, short-term memory is sharp', dosha: 'VATA' },
      { label: 'Learns moderately, retains very well, logical retention', dosha: 'PITTA' },
      { label: 'Learns slowly but never forgets, long-term memory is exceptional', dosha: 'KAPHA' }
    ]
  },
  {
    id: 8,
    category: 'Mental',
    text: 'What is your emotional temperament under normal conditions?',
    options: [
      { label: 'Anxious, fearful, nervous, highly creative, enthusiastic', dosha: 'VATA' },
      { label: 'Ambitious, passionate, competitive, aggressive, self-confident', dosha: 'PITTA' },
      { label: 'Calm, patient, forgiving, loving, stable, sometimes lazy/stubborn', dosha: 'KAPHA' }
    ]
  },
  {
    id: 9,
    category: 'Mental',
    text: 'How do you respond under intense stress?',
    options: [
      { label: 'Worry, anxiety, fear, panics easily, scattered thoughts', dosha: 'VATA' },
      { label: 'Anger, irritation, impatience, critical of others, frustrated', dosha: 'PITTA' },
      { label: 'Withdrawal, denial, slow reactions, lethargic, passive-aggressive', dosha: 'KAPHA' }
    ]
  },
  {
    id: 10,
    category: 'Mental',
    text: 'What is your decision-making style?',
    options: [
      { label: 'Indecisive, vacillating, changes mind frequently', dosha: 'VATA' },
      { label: 'Quick, analytical, decisive, sticks to choice logically', dosha: 'PITTA' },
      { label: 'Slow, cautious, deliberate, seeks opinion, sticks to choice firmly', dosha: 'KAPHA' }
    ]
  },

  // 3. Digestive
  {
    id: 11,
    category: 'Digestive',
    text: 'Describe your natural appetite.',
    options: [
      { label: 'Variable, irregular, sometimes forgets to eat, easily gets full', dosha: 'VATA' },
      { label: 'Strong, intense, cannot skip meals without getting angry/acidic', dosha: 'PITTA' },
      { label: 'Moderate but constant, digests slowly, can skip meals easily', dosha: 'KAPHA' }
    ]
  },
  {
    id: 12,
    category: 'Digestive',
    text: 'How is your digestion and bowel habit?',
    options: [
      { label: 'Irregular, prone to gas, bloating, and chronic constipation', dosha: 'VATA' },
      { label: 'Quick, prone to loose stools, heartburn, or acidity', dosha: 'PITTA' },
      { label: 'Slow, heavy, sluggish, regular solid stools', dosha: 'KAPHA' }
    ]
  },
  {
    id: 13,
    category: 'Digestive',
    text: 'What is your thirst pattern?',
    options: [
      { label: 'Variable, sometimes forgets to drink water, prefers warm fluids', dosha: 'VATA' },
      { label: 'Strong, drinks high quantities of water, prefers cold/iced drinks', dosha: 'PITTA' },
      { label: 'Low, moderate thirst, drinks small quantities warm/regular water', dosha: 'KAPHA' }
    ]
  },
  {
    id: 14,
    category: 'Digestive',
    text: 'What food tastes do you prefer?',
    options: [
      { label: 'Prefers sweet, sour, salty, warm, oily, heavy foods', dosha: 'VATA' },
      { label: 'Prefers sweet, bitter, astringent, cold, dry foods', dosha: 'PITTA' },
      { label: 'Prefers pungent, bitter, astringent, hot, light, dry foods', dosha: 'KAPHA' }
    ]
  },
  {
    id: 15,
    category: 'Digestive',
    text: 'How do you feel after eating a heavy meal?',
    options: [
      { label: 'Light, bloated or flatulent, digestion remains erratic', dosha: 'VATA' },
      { label: 'Heartburn, warm body temperature, digestion is rapid', dosha: 'PITTA' },
      { label: 'Extremely heavy, sleepy, sluggish, digests very slowly', dosha: 'KAPHA' }
    ]
  },

  // 4. Lifestyle
  {
    id: 16,
    category: 'Lifestyle',
    text: 'Describe your spending and budgeting habit.',
    options: [
      { label: 'Spends money quickly on impulse, struggles to save', dosha: 'VATA' },
      { label: 'Spends money on luxury or practical investments, keeps careful budget', dosha: 'PITTA' },
      { label: 'Saves money consistently, struggles to spend even on essentials', dosha: 'KAPHA' }
    ]
  },
  {
    id: 17,
    category: 'Lifestyle',
    text: 'What is your climate and weather preference?',
    options: [
      { label: 'Hates cold, dry, windy weather; loves warm, sunny weather', dosha: 'VATA' },
      { label: 'Hates hot, humid, sunny weather; loves cool, dry weather', dosha: 'PITTA' },
      { label: 'Hates cold, damp, cloudy weather; loves hot, dry weather', dosha: 'KAPHA' }
    ]
  },
  {
    id: 18,
    category: 'Lifestyle',
    text: 'How are your physical energy levels throughout the day?',
    options: [
      { label: 'Variable, comes in bursts, tires easily and suddenly', dosha: 'VATA' },
      { label: 'Moderate, highly competitive, pushes self to exhaustion', dosha: 'PITTA' },
      { label: 'Consistent, slow build, has high stamina and endurance', dosha: 'KAPHA' }
    ]
  },
  {
    id: 19,
    category: 'Lifestyle',
    text: 'How do you naturally interact socially?',
    options: [
      { label: 'Very social, loves talking, meets new friends easily, energetic', dosha: 'VATA' },
      { label: 'Selective, logical, likes deep intellectual debates, assertive', dosha: 'PITTA' },
      { label: 'Reserved, loyal, loves small groups of old friends, calm', dosha: 'KAPHA' }
    ]
  },
  {
    id: 20,
    category: 'Lifestyle',
    text: 'Describe your organizational habits.',
    options: [
      { label: 'Messy, disorganized, frequently loses keys or items', dosha: 'VATA' },
      { label: 'Highly organized, tidy, labels items, schedules day logically', dosha: 'PITTA' },
      { label: 'Slow to organize, accumulates items, dislikes cleanups', dosha: 'KAPHA' }
    ]
  }
];

export function PrakritiAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const saveMutation = useSaveAssessment(id);

  // 1. Fetch patient details
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patients', 'detail', id],
    queryFn: async () => {
      const res = await api.get(`/patients/${id}`);
      return res.data.data;
    }
  });

  // Track user answers
  const [answers, setAnswers] = useState<{ [qId: number]: 'VATA' | 'PITTA' | 'KAPHA' }>({});
  const [currentStep, setCurrentStep] = useState(0); // 4 Categories = 4 Steps

  const categories = ['Physical', 'Mental', 'Digestive', 'Lifestyle'] as const;
  const currentCategory = categories[currentStep];

  const stepQuestions = QUESTIONS.filter((q) => q.category === currentCategory);

  const handleSelect = (qId: number, dosha: 'VATA' | 'PITTA' | 'KAPHA') => {
    setAnswers({ ...answers, [qId]: dosha });
  };

  const handleNext = () => {
    // Validate all questions in current step are answered
    const unanswered = stepQuestions.some((q) => !answers[q.id]);
    if (unanswered) {
      toast.error(`Please answer all questions under ${currentCategory} details`);
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = () => {
    // Validate all 20 questions are answered
    const totalAnswered = Object.keys(answers).length;
    if (totalAnswered < 20) {
      toast.error('Please complete all 20 questions before submitting');
      return;
    }

    // Calculate scores
    let vataCount = 0;
    let pittaCount = 0;
    let kaphaCount = 0;

    Object.values(answers).forEach((dosha) => {
      if (dosha === 'VATA') vataCount++;
      if (dosha === 'PITTA') pittaCount++;
      if (dosha === 'KAPHA') kaphaCount++;
    });

    const vata = Math.round((vataCount / 20) * 100);
    const pitta = Math.round((pittaCount / 20) * 100);
    const kapha = Math.round((kaphaCount / 20) * 100);

    // Find Dominance
    let dominance = 'VATA';
    let max = vata;
    if (pitta > max) {
      dominance = 'PITTA';
      max = pitta;
    }
    if (kapha > max) {
      dominance = 'KAPHA';
    }

    const payload = {
      prakriti: { vata, pitta, kapha, dominance }
    };

    saveMutation.mutate(payload, {
      onSuccess: () => {
        navigate(`/patients/${id}`);
      }
    });
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <Link to={`/patients/${id}`} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-semibold text-slate-400">Back to Patient clinical file</span>
      </div>

      <PageHeader
        title="Ayurvedic Prakriti Constitutional Check"
        description={`Assess physical, mental and digestive parameters to calculate Prakriti balance for ${patient?.user?.name || 'Patient'}.`}
      />

      {/* Progress Stepper Header */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {categories.map((cat, idx) => (
          <div
            key={cat}
            className={`h-2.5 rounded-full border transition-all duration-300 ${
              idx <= currentStep 
                ? 'bg-brand-750 border-brand-700' 
                : 'bg-slate-100 border-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Questions Form Panel */}
      <div className="glass-panel p-6 sm:p-8 space-y-8 shadow-md">
        <div>
          <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-200 uppercase tracking-widest">
            Step {currentStep + 1} of 4: {currentCategory} Traits
          </span>
          <h2 className="text-xl font-bold font-display text-slate-800 mt-3 border-b border-slate-100 pb-2">
            {currentCategory} Constitutional Traits
          </h2>
        </div>

        {/* Render Step Questions */}
        <div className="space-y-8 divide-y divide-slate-100/50">
          {stepQuestions.map((q, qIdx) => (
            <div key={q.id} className={`${qIdx > 0 ? 'pt-8' : ''} space-y-4`}>
              <h3 className="text-sm font-bold text-slate-800 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-display font-semibold flex items-center justify-center shrink-0 text-[10px]">
                  {q.id}
                </span>
                <span>{q.text}</span>
              </h3>

              {/* Radio options */}
              <div className="space-y-2.5 pl-7">
                {q.options.map((opt, optIdx) => {
                  const isChecked = answers[q.id] === opt.dosha;
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-slate-50/50 transition-all ${
                        isChecked
                          ? 'bg-brand-50/20 border-brand-700/60 shadow-sm shadow-brand-500/5'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={isChecked}
                        onChange={() => handleSelect(q.id, opt.dosha)}
                        className="w-4.5 h-4.5 text-brand-700 border-slate-300 focus:ring-brand-500 mt-0.5"
                      />
                      <span className="text-xs text-slate-600 font-medium leading-relaxed">
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Navigator buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-600 rounded-xl shadow-md transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-brand-750 hover:bg-brand-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Calculate Prakriti Dominance</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default PrakritiAssessment;
