'use client'

import Link from 'next/link'
import { theme } from '@/constants/colors'

export default function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: '14px',
        color: theme.text.secondary,
        textDecoration: 'none',
        padding: '6px 12px',
        borderRadius: '8px',
        fontWeight: 500,
        transition: 'color 0.15s',
      }}
    >
      {children}
    </Link>
  )
}