'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { theme } from '@/constants/colors'

const TABS = [
  { key: 'tasks',    label: '📋 Tasks',    },
  { key: 'files',    label: '📁 Files',    },
  { key: 'meetings', label: '📅 Meetings', },
  { key: 'overview', label: '📊 Overview', },
]

export default function WorkspaceTabs({ activeTab, projectId }) {
  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      borderBottom: `1px solid ${theme.border.light}`,
      paddingBottom: '0',
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key
        return (
          <Link
            key={tab.key}
            href={`/projects/${projectId}/workspace?tab=${tab.key}`}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? theme.text.indigo : theme.text.secondary,
              textDecoration: 'none',
              borderBottom: isActive ? `2px solid ${theme.action.primary}` : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}