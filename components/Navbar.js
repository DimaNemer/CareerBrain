'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import NavLink from '@/components/NavLink'
import LogoutButton from '@/components/LogoutButton'
import NotificationBellWrapper from '@/components/notifications/NotificationBellWrapper'
import UserSearch from '@/components/UserSearch'
import { theme } from '@/constants/colors'

export default function Navbar({ isLoggedIn = false }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile drawer whenever the route changes (link click / back button).
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  // Close the mobile drawer if the viewport grows to tablet/desktop width (>= 768px),
  // e.g. rotating a phone to landscape or resizing a window.
  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia('(min-width: 768px)')
    const handleChange = (e) => { if (e.matches) setOpen(false) }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [open])

  const close = () => setOpen(false)
  const toggle = () => setOpen((o) => !o)

  const logo = (
    <Link
      href={isLoggedIn ? '/dashboard' : '/'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          background: theme.action.primary,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}
      >
        🧠
      </div>

      <span
        style={{
          fontWeight: 700,
          fontSize: '16px',
          color: theme.text.primary,
          letterSpacing: '-0.3px',
          whiteSpace: 'nowrap',
        }}
      >
        Career Brain
      </span>
    </Link>
  )

  const hamburger = (
    <button
      onClick={toggle}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        marginLeft: '8px',
        borderRadius: '8px',
        color: theme.text.primary,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg.hover }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
    >
      {open ? <X size={24} /> : <Menu size={24} />}
    </button>
  )

  return (
    <nav
      className="px-4 md:px-6"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: theme.bg.card,
        borderBottom: `1px solid ${theme.border.light}`,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {logo}

      {isLoggedIn ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
          }}
        >
          {/* Desktop navigation (>= 768px) */}
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <NavLink href="/upload-cv">
              Upload CV
            </NavLink>

            <NavLink href="/opportunities">
              Jobs
            </NavLink>

            <NavLink href="/projects">
              Projects
            </NavLink>

            <NavLink href="/profile">
              Profile
            </NavLink>

            <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserSearch />
              <LogoutButton />
            </div>
          </div>

          {/* Mobile search bar, next to the notification bell */}
          <div
            className="md:hidden"
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <UserSearch fullWidth />
          </div>

          {/* Mounted once, visible on every screen size */}
          <NotificationBellWrapper />

          <div className="md:hidden">
            {hamburger}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Desktop auth links (>= 768px) */}
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <NavLink href="/login">
              Log in
            </NavLink>

            <Link
              href="/signup"
              style={{
                background: theme.action.primary,
                color: theme.action.primaryText,
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
            >
              Get started
            </Link>
          </div>

          <div className="md:hidden">
            {hamburger}
          </div>
        </div>
      )}

      {/* Backdrop + right-side drawer (< 768px) */}
      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {open && (
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              style={{
                position: 'fixed',
                top: '60px',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 40,
                background: 'rgba(15,23,42,0.35)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
              }}
            />
          )}

          {open && (
            <motion.div
              key="nav-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              style={{
                position: 'fixed',
                top: '60px',
                right: 0,
                bottom: 0,
                width: 'min(300px, 82vw)',
                zIndex: 50,
                background: theme.bg.card,
                borderLeft: `1px solid ${theme.border.light}`,
                boxShadow: '-12px 0 32px rgba(15,23,42,0.18)',
                padding: '8px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {isLoggedIn ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <NavLink mobile href="/upload-cv" onClick={close}>
                      Upload CV
                    </NavLink>
                    <NavLink mobile href="/opportunities" onClick={close}>
                      Jobs
                    </NavLink>
                    <NavLink mobile href="/projects" onClick={close}>
                      Projects
                    </NavLink>
                    <NavLink mobile href="/profile" onClick={close}>
                      Profile
                    </NavLink>
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: `1px solid ${theme.border.light}`,
                    }}
                  >
                    <LogoutButton variant="mobile" />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <NavLink mobile href="/login" onClick={close}>
                    Log in
                  </NavLink>
                  <Link
                    href="/signup"
                    onClick={close}
                    style={{
                      background: theme.action.primary,
                      color: theme.action.primaryText,
                      padding: '12px 16px',
                      borderRadius: '9px',
                      fontSize: '14px',
                      fontWeight: 500,
                      textDecoration: 'none',
                      textAlign: 'center',
                      marginTop: '6px',
                    }}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </nav>
  )
}
