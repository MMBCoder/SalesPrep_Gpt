import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../App'

export function SidebarToggle() {
  return (
    <button
      className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-[#111] text-white text-xl flex-shrink-0"
      onClick={() => window.dispatchEvent(new Event('toggleSidebar'))}
      aria-label="Open menu"
    >
      ☰
    </button>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const toggle = () => setIsOpen(o => !o)
    window.addEventListener('toggleSidebar', toggle)
    return () => window.removeEventListener('toggleSidebar', toggle)
  }, [])

  useEffect(() => { setIsOpen(false) }, [location.pathname])

  const path = location.pathname
  const isDashboard = path === '/dashboard' || path.startsWith('/briefs') || path === '/brief-loading'
  const isHistory   = path === '/history'
  const isMyBriefs  = path === '/my-briefs'
  const isSettings  = path === '/settings'

  function NavItem({ label, active, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-3 rounded-lg text-[15px] font-semibold text-white relative ${active ? '' : 'hover:bg-[#1A1A1A]'}`}
      >
        {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-full" />}
        <span className={active ? 'bg-[#1A1A1A] px-4 py-3 rounded-lg w-full text-left -ml-4' : 'w-full text-left'}>{label}</span>
      </button>
    )
  }

  const sidebarContent = (
    <div className="w-[248px] h-full bg-[#111111] flex flex-col py-8 px-4">
      <div className="mb-10 px-2 flex items-center justify-between">
        <span className="text-white font-bold text-xl">SalesPrep</span>
        <button className="md:hidden text-white text-2xl leading-none" onClick={() => setIsOpen(false)} aria-label="Close">✕</button>
      </div>
      <nav className="flex-1 space-y-1">
        <NavItem label="Dashboard" active={isDashboard} onClick={() => navigate('/dashboard')} />
        <NavItem label="History"   active={isHistory}   onClick={() => navigate('/history')} />
        <NavItem label="My Briefs" active={isMyBriefs}  onClick={() => navigate('/my-briefs')} />
        <NavItem label="Settings"  active={isSettings}  onClick={() => navigate('/settings')} />
      </nav>
      <div className="mt-auto pt-6 border-t border-[#2a2a2a]">
        {user && <p className="text-gray-400 text-xs px-4 mb-2 truncate">{user.email}</p>}
        <button onClick={logout} className="w-full text-left px-4 py-3 text-[15px] font-semibold text-white hover:bg-[#1A1A1A] rounded-lg">Log Out</button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: permanent sidebar */}
      <div className="hidden md:flex flex-shrink-0 min-h-screen">
        {sidebarContent}
      </div>

      {/* Mobile: overlay drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative z-10 flex-shrink-0 h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
