import React from 'react'

export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-screen">
      {/* Left panel — hidden on mobile */}
      <div className="hidden md:flex w-1/2 bg-primary flex-col justify-center px-16 py-12">
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

      {/* Right panel — full width on mobile */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-6 sm:px-12 md:px-[80px] py-12 overflow-y-auto min-h-screen md:min-h-0">
        {/* Brand mark shown only on mobile (replaces hidden left panel) */}
        <div className="md:hidden mb-8">
          <span className="text-primary font-bold text-2xl">SalesPrep</span>
          <p className="text-gray-400 text-sm mt-1">AI-powered sales briefs</p>
        </div>
        {children}
        <p className="text-[12px] font-medium text-gray-400 mt-8">AI-Generated content. For internal use only.</p>
      </div>
    </div>
  )
}
