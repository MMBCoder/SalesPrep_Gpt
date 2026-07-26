import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar, { SidebarToggle } from '../components/Sidebar'
import api from '../api'

const STEPS = [
  'Searching web for company data',
  'Analysing quarterly financials',
  'Comparing with competitors',
  'Generating AI insights with GPT-4o-mini',
]

export default function BriefLoading() {
  const navigate = useNavigate()
  const location = useLocation()
  const clientName = location.state?.clientName || 'Client'
  const meetingDate = location.state?.meetingDate || ''
  const meetingTime = location.state?.meetingTime || ''
  const meetingLocation = location.state?.meetingLocation || ''
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let step = 0
    const stepInterval = setInterval(() => {
      if (step < STEPS.length - 1) { step++; setCurrentStep(step) }
    }, 6000)

    const progInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 92) { clearInterval(progInterval); return 92 }
        return p + 1
      })
    }, 280)

    const generate = async () => {
      try {
        const res = await api.post('/briefs/generate', {
          client_name: clientName,
          industry: location.state?.industry || 'FMCG',
          client_type: location.state?.clientType || 'Distributor',
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          meeting_location: meetingLocation,
        }, { timeout: 120000 })
        clearInterval(stepInterval)
        clearInterval(progInterval)
        setCurrentStep(STEPS.length - 1)
        setProgress(100)
        setTimeout(() => navigate(`/briefs/${res.data.id}`), 600)
      } catch (e) {
        console.error('Brief generation error:', e)
        navigate('/dashboard')
      }
    }
    generate()
    return () => { clearInterval(stepInterval); clearInterval(progInterval) }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6">
        {/* Mobile top bar */}
        <div className="absolute top-4 left-4 md:hidden">
          <SidebarToggle />
        </div>

        <p className="text-[13px] text-gray-label mb-6 md:mb-8">Dashboard › Generating brief</p>
        <h2 className="text-[22px] md:text-[28px] font-bold text-[#111] mb-2 text-center">{clientName}</h2>
        <p className="text-[15px] md:text-[18px] text-gray-label mb-8 md:mb-10 text-center">Building your AI-powered brief...</p>

        <div className="w-full max-w-sm px-2 space-y-4 mb-8 md:mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-500 ${i <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-[13px] md:text-[14px] flex-1 ${i <= currentStep ? 'text-primary font-semibold' : 'text-gray-label'}`}>{s}</span>
              {i === currentStep && (
                <div className="flex gap-1">
                  {[0, 1, 2].map(d => <div key={d} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="w-full max-w-sm px-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-label mt-2 text-center">{progress}%</p>
        </div>
        <p className="text-[12px] md:text-[13px] text-gray-400 mt-6 text-center">This may take 20–30 seconds while we fetch live web data</p>
      </div>
    </div>
  )
}
