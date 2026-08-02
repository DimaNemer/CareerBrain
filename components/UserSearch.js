'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/constants/colors'

export default function UserSearch({
  fullWidth = false,
}) {
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(-1)

  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const abortRef = useRef(null)

  const search = useCallback(async q => {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    if (!q || q.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)

    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(
          q.trim()
        )}&limit=8`,
        {
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        setResults([])
        return
      }

      const data = await response.json()

      setResults(
        Array.isArray(data.users)
          ? data.users
          : []
      )
    } catch (error) {
      if (error.name !== 'AbortError') {
        setResults([])
      }
    } finally {
      if (
        abortRef.current === controller
      ) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [query, search])

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setOpen(false)
        setSelected(-1)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  function navigateTo(result) {
    if (!result?.id) return

    setOpen(false)
    setQuery('')
    setResults([])
    setSelected(-1)

    if (result.role === 'employer') {
      router.push(`/company/${result.id}`)
      return
    }

    router.push(`/profile/${result.id}`)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()

      setSelected(current =>
        Math.min(
          current + 1,
          results.length - 1
        )
      )

      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()

      setSelected(current =>
        Math.max(current - 1, -1)
      )

      return
    }

    if (
      event.key === 'Enter' &&
      selected >= 0 &&
      results[selected]
    ) {
      event.preventDefault()
      navigateTo(results[selected])
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      setSelected(-1)
      inputRef.current?.blur()
    }
  }

  function clearSearch() {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    setQuery('')
    setResults([])
    setSelected(-1)
    setLoading(false)
    inputRef.current?.focus()
  }

  const showDropdown =
    open && query.trim().length >= 2

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        width: fullWidth
          ? '100%'
          : undefined,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: fullWidth
            ? '100%'
            : undefined,
          boxSizing: 'border-box',
          padding: '6px 12px',
          borderRadius: '8px',
          border: `1.5px solid ${
            open
              ? theme.action.primary
              : theme.border.light
          }`,
          background: theme.bg.hover,
          transition:
            'border-color 0.2s, box-shadow 0.2s',
          boxShadow: open
            ? '0 0 0 3px rgba(91,79,232,0.1)'
            : 'none',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.text.tertiary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
          }}
        >
          <circle
            cx="11"
            cy="11"
            r="8"
          />

          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={event => {
            setQuery(event.target.value)
            setOpen(true)
            setSelected(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search people or companies..."
          aria-label="Search people or companies"
          autoComplete="off"
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '13px',
            color: theme.text.primary,
            width: fullWidth
              ? '100%'
              : '190px',
            flex: fullWidth
              ? '1'
              : undefined,
            minWidth: 0,
            fontWeight: 500,
          }}
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.text.tertiary,
              padding: '2px',
              lineHeight: 1,
              display: 'flex',
              flexShrink: 0,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"
              />

              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: fullWidth ? 0 : 'auto',
            width: fullWidth
              ? '100%'
              : undefined,
            minWidth: fullWidth
              ? 0
              : '320px',
            maxWidth:
              'calc(100vw - 24px)',
            background: '#FFFFFF',
            border: `1px solid ${theme.border.light}`,
            borderRadius: '14px',
            boxShadow:
              '0 20px 50px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {loading &&
          results.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color:
                  theme.text.tertiary,
                fontSize: '13px',
              }}
            >
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  marginBottom: '8px',
                }}
              >
                🔍
              </div>

              <div
                style={{
                  color:
                    theme.text.tertiary,
                  fontSize: '13px',
                }}
              >
                {`No people or companies found for "${query}"`}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '6px',
                maxHeight: '420px',
                overflowY: 'auto',
              }}
            >
              {results.map(
                (result, index) => {
                  const isEmployer =
                    result.role ===
                    'employer'

                  const displayName =
                    isEmployer
                      ? result.company_name ||
                        result.full_name ||
                        'Company'
                      : result.full_name ||
                        'Unknown'

                  const displaySubtitle =
                    isEmployer
                      ? result.employer_headline ||
                        result.company_industry ||
                        result.company_location ||
                        'Employer'
                      : result.headline ||
                        `@${
                          result.username ||
                          'user'
                        }`

                  const displayImage =
                    isEmployer
                      ? result.company_logo_url
                      : result.avatar_url

                  const initials =
                    displayName
                      .split(/\s+/)
                      .filter(Boolean)
                      .map(
                        word => word[0]
                      )
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '?'

                  return (
                    <div
                      key={result.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigateTo(result)
                      }
                      onKeyDown={event => {
                        if (
                          event.key ===
                            'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault()
                          navigateTo(result)
                        }
                      }}
                      onMouseEnter={() =>
                        setSelected(index)
                      }
                      onMouseLeave={() =>
                        setSelected(-1)
                      }
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: '12px',
                        padding:
                          '10px 12px',
                        borderRadius:
                          '10px',
                        cursor: 'pointer',
                        background:
                          index ===
                          selected
                            ? theme.bg
                                .hover
                            : 'transparent',
                        transition:
                          'background 0.1s',
                        outline: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius:
                            isEmployer
                              ? '10px'
                              : '50%',
                          overflow:
                            'hidden',
                          flexShrink: 0,
                          background:
                            displayImage
                              ? 'transparent'
                              : `linear-gradient(135deg, ${theme.action.primary}, #818CF8)`,
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                        }}
                      >
                        {displayImage ? (
                          <img
                            src={
                              displayImage
                            }
                            alt={
                              displayName
                            }
                            style={{
                              width:
                                '100%',
                              height:
                                '100%',
                              objectFit:
                                'cover',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize:
                                '13px',
                              fontWeight:
                                700,
                              color:
                                '#FFFFFF',
                            }}
                          >
                            {initials}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: '7px',
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              minWidth: 0,
                              fontSize:
                                '14px',
                              fontWeight:
                                600,
                              color:
                                theme.text
                                  .primary,
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            {displayName}
                          </div>

                          <span
                            style={{
                              flexShrink: 0,
                              padding:
                                '2px 7px',
                              borderRadius:
                                '999px',
                              background:
                                isEmployer
                                  ? '#F3E8FF'
                                  : '#EEF2FF',
                              color:
                                isEmployer
                                  ? '#7C3AED'
                                  : '#4338CA',
                              fontSize:
                                '9px',
                              fontWeight:
                                700,
                            }}
                          >
                            {isEmployer
                              ? 'Company'
                              : 'Job seeker'}
                          </span>
                        </div>

                        <div
                          style={{
                            marginTop:
                              '2px',
                            fontSize:
                              '12px',
                            color:
                              theme.text
                                .tertiary,
                            overflow:
                              'hidden',
                            textOverflow:
                              'ellipsis',
                            whiteSpace:
                              'nowrap',
                          }}
                        >
                          {
                            displaySubtitle
                          }
                        </div>

                        {isEmployer &&
                          result.full_name &&
                          result.company_name && (
                            <div
                              style={{
                                marginTop:
                                  '2px',
                                color:
                                  theme
                                    .text
                                    .tertiary,
                                fontSize:
                                  '10px',
                                overflow:
                                  'hidden',
                                textOverflow:
                                  'ellipsis',
                                whiteSpace:
                                  'nowrap',
                              }}
                            >
                              Represented by{' '}
                              {
                                result.full_name
                              }
                            </div>
                          )}
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}