import React from 'react'

export default function AuthLayout({ children }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left panel */}
      <div className="w-1/2 bg-primary flex flex-col justify-center px-16 py-12">
        <h1 className="text-white font-bold text-[48px] leading-tight mb-4">
          Walk in ready.<br />Every time.
        </h1>
        <p className="text-white text-[16px] font-normal leading-relaxed mb-10 opacity-90">
          AI-generated pre-meeting briefs<br />
          for FMCG sales reps. Ready in under 2 minutes.
        </p>
        <div className="bg-white rounded-lg px-5 py-3 inline-flex items-center gap-2 max-w-xs">
          <span className="text-primary text-[13px] font-medium">Saves 45 min of prep per meeting ✓</span>
        </div>
      </div>
      {/* Right panel */}
      <div className="w-1/2 bg-white flex flex-col justify-center px-[80px] py-12 overflow-y-auto">
        {children}
        <p className="text-[12px] font-medium text-gray-400 mt-8">AI-Generated content. For internal use only.</p>
      </div>
    </div>
  )
}
