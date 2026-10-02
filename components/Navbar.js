'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import NavLink from '@/components/NavLink'
import LogoutButton from '@/components/LogoutButton'
import NotificationBellWrapper from '@/components/notifications/NotificationBellWrapper'
import UserSearch from '@/components/UserSearch'
import { theme } from '@/constants/colors'
export default function Navbar({
  isLoggedIn = false,
  role = null,
}) {
  const [open, setOpen] = useState(false)
 

  const isEmployer = role === 'employer'

  const dashboardHref = isEmployer
    ? '/employer/dashboard'
    : '/dashboard'

  const profileHref = isEmployer
    ? '/employer/profile'
    : '/profile'

  const close = () => setOpen(false)
  const toggle = () =>
    setOpen(currentOpen => !currentOpen)

  useEffect(() => {
    if (!open) return

    const mq = window.matchMedia(
      '(min-width: 768px)'
    )

    const handleChange = event => {
      if (event.matches) {
        setOpen(false)
      }
    }

    mq.addEventListener(
      'change',
      handleChange
    )

    return () => {
      mq.removeEventListener(
        'change',
        handleChange
      )
    }
  }, [open])

  // The drawer covers the page but the page behind it still scrolled, and
  // Escape did nothing. Lock the body and let Escape dismiss.
  useEffect(() => {
    if (!open) return

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [open])

  const logo = (
    <Link
      href={isLoggedIn ? dashboardHref : '/'}
      onClick={close}
      className="navbar-brand"
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
          flexShrink: 0,
        }}
      >
        🧠
      </div>

      <span
        className="navbar-wordmark"
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
      aria-controls="navbar-drawer"
      className="navbar-icon-button"
      style={{ color: theme.text.primary }}
      onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg.hover }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
    >
      {open ? <X size={24} /> : <Menu size={24} />}
    </button>
  )

  return (
    <nav
      className="navbar px-4 md:px-6"
      style={{
        background: theme.bg.card,
        borderBottom: `1px solid ${theme.border.light}`,
      }}
    >
      {logo}

      {isLoggedIn ? (
        <div className="navbar-actions">
          {/* Desktop navigation (>= 768px) */}
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              gap: '4px',
            }}
          >
        {!isEmployer && (
  <NavLink href="/upload-cv">
    Upload CV
  </NavLink>
)}

<NavLink href="/opportunities">
  Jobs
</NavLink>

<NavLink href="/projects">
  Projects
</NavLink>

<NavLink href={profileHref}>
  Profile
</NavLink>

            <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserSearch />
              <LogoutButton />
            </div>
          </div>

          {/* Mobile search bar, next to the notification bell */}
          <div className="navbar-search md:hidden">
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
              className="navbar-offset"
              style={{
                position: 'fixed',
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
              id="navbar-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="navbar-offset"
              style={{
                position: 'fixed',
                right: 0,
                bottom: 0,
                width: 'min(300px, 82vw)',
                zIndex: 50,
                background: theme.bg.card,
                borderLeft: `1px solid ${theme.border.light}`,
                boxShadow: '-12px 0 32px rgba(15,23,42,0.18)',
                padding: '8px 16px 16px',
                paddingBottom:
                  'calc(16px + env(safe-area-inset-bottom, 0px))',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
              }}
            >
              {isLoggedIn ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
               {!isEmployer && (
  <NavLink
    mobile
    href="/upload-cv"
    onClick={close}
  >
    Upload CV
  </NavLink>
)}

<NavLink
  mobile
  href="/opportunities"
  onClick={close}
>
  Jobs
</NavLink>

<NavLink
  mobile
  href="/projects"
  onClick={close}
>
  Projects
</NavLink>

<NavLink
  mobile
  href={profileHref}
  onClick={close}
>
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
