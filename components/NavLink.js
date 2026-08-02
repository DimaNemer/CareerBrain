'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { theme } from '@/constants/colors'

export default function NavLink({ href, children, onClick, mobile = false }) {
  const pathname = usePathname()

  const isActive =
    pathname === href ||
    (href !== '/' && pathname.startsWith(`${href}/`))

  // Mobile drawer variant: full-width row with hover/press feedback,
  // active route highlight and a small indicator dot.
  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm transition-all duration-150 hover:bg-purple-50 active:scale-[0.97] ${
          isActive
            ? 'bg-purple-100 font-semibold text-purple-700'
            : 'font-medium text-slate-600'
        }`}
      >
        <span>{children}</span>
        {isActive && (
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full bg-purple-600"
            aria-hidden="true"
          />
        )}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        fontSize: '14px',
        color: isActive
          ? '#4338CA'
          : theme.text.secondary,
        textDecoration: 'none',
        padding: '8px 12px',
        borderRadius: '9px',
        fontWeight: isActive ? 700 : 500,
        background: isActive
          ? '#EEF2FF'
          : 'transparent',
        transition:
          'color 0.15s, background 0.15s',
      }}
    >
      {children}
    </Link>
  )
}
