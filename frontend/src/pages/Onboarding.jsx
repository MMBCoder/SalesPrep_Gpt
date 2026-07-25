import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../api'

const slides = [
  {
    step: 'Step 1 of 3',
    title: 'Generate a brief in under 2 minutes',
    desc: 'Just type a distributor or client name. SalesPrep pulls public financial data, news, market signals and delivers a ready brief instantly.',
    img: '📊',
  },
  {
    step: 'Step 2 of 3',
    title: 'Your brief has 2 sections',
    desc: 'Company background and recent news, all sourced from public data with clickable links of sources.',
    img: '📰',
  },
  {
    step: 'Step 3 of 3',
    title: 'Walk in ready. Every time.',
    desc: 'Rate each brief after your meeting. SalesPrep learns what works best for your accounts.',
    img: '⭐',
  },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleFinish = async () => {
    await api.put('/me/onboarding')
    navigate('/profile-setup')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-[600px] w-full mx-4">
        <div className="flex justify-between items-center mb-8">
          <span className="text-[14px] font-medium text-gray-label">{slides[step].step}</span>
          <button onClick={handleFinish} className="text-[20px] font-semibold text-primary hover:underline">Skip tour</button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mb-10">
          {slides.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="text-center mb-10">
          <div className="text-6xl mb-6">{slides[step].img}</div>
          <h2 className="text-[28px] font-bold text-[#111] mb-4">{slides[step].title}</h2>
          <p className="text-[20px] text-gray-label leading-relaxed">{slides[step].desc}</p>
        </div>

        <div className="flex gap-3 justify-center">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="px-8 py-3 rounded-lg border-2 border-primary text-primary font-semibold text-[20px] hover:bg-primary-light transition-colors">
              ← Back
            </button>
          )}
          {step < slides.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-8 py-3 rounded-lg bg-primary text-white font-semibold text-[20px] hover:opacity-90 transition-opacity">
              Next →
            </button>
          ) : (
            <button onClick={handleFinish} className="px-8 py-3 rounded-lg bg-primary text-white font-semibold text-[20px] hover:opacity-90 transition-opacity">
              Get started →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
