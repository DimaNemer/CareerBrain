'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { theme } from '@/constants/colors'

export default function NavLink({ href, children }) {
  const pathname = usePathname()

  const isActive =
    pathname === href ||
(href !== '/' && pathname.startsWith(`${href}/`))
  return (
    <Link
      href={href}
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