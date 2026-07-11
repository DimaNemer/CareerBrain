'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  FolderSearch,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { getProjectStatusLabel } from '@/lib/project-status'

const STATUS_STYLES = {
  open: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  active: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  completed: 'border-sky-200 bg-sky-50 text-sky-700',
  archived: 'border-slate-200 bg-slate-100 text-slate-600',
}

export default function ProjectBrowser({ projects }) {
  const [search, setSearch] = useState('')
  const [skillSearch, setSkillSearch] = useState('')
  const [roleTitle, setRoleTitle] = useState('')

  const roleTitles = useMemo(() => {
    const titles = new Map()

    projects.forEach((project) => {
      project.project_roles?.forEach((role) => {
        const normalizedTitle = role.role_title.trim().toLowerCase()

        if (!titles.has(normalizedTitle)) {
          titles.set(normalizedTitle, role.role_title.trim())
        }
      })
    })

    return [...titles.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [projects])

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const normalizedSkillSearch = skillSearch.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesName =
        !normalizedSearch ||
        project.title.toLowerCase().includes(normalizedSearch)

      const matchesRoleFilters = project.project_roles?.some((role) => {
        const matchesSkill =
          !normalizedSkillSearch ||
          role.skills?.name?.toLowerCase().includes(normalizedSkillSearch)
        const matchesRole =
          !roleTitle || role.role_title.trim().toLowerCase() === roleTitle

        return matchesSkill && matchesRole
      })

      return (
        matchesName &&
        (!normalizedSkillSearch && !roleTitle ? true : matchesRoleFilters)
      )
    })
  }, [projects, roleTitle, search, skillSearch])

  function clearFilters() {
    setSearch('')
    setSkillSearch('')
    setRoleTitle('')
  }

  const hasFilters = Boolean(search || skillSearch || roleTitle)

  return (
    <>
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <SlidersHorizontal size={16} />
          </span>
          Find your next project
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6">
          <label
            htmlFor="project-search"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
              Project name
          </label>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="project-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
          <label
            htmlFor="skill-filter"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
              Skill
          </label>
          <input
            id="skill-filter"
            type="search"
            value={skillSearch}
            onChange={(event) => setSkillSearch(event.target.value)}
            placeholder="Search skills..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>

          <div className="lg:col-span-3">
          <label
            htmlFor="role-filter"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
              Role
          </label>
          <select
            id="role-filter"
            value={roleTitle}
            onChange={(event) => setRoleTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">All roles</option>
            {roleTitles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        </div>

        <div className="mt-4 flex min-h-8 flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Showing{' '}
            <strong className="font-semibold text-slate-800">
              {filteredProjects.length}
            </strong>{' '}
            {filteredProjects.length === 1 ? 'project' : 'projects'}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <RotateCcw size={14} />
              Clear filters
            </button>
          )}
        </div>
      </section>

      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FolderSearch size={27} />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            No matching projects
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Try changing your search or filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RotateCcw size={15} />
            Reset search
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredProjects.map((project) => {
            const projectRoles = [
              ...new Set(
                (project.project_roles || []).map((role) => role.role_title)
              ),
            ]
            const projectSkills = [
              ...new Set(
                (project.project_roles || [])
                  .map((role) => role.skills?.name)
                  .filter(Boolean)
              ),
            ]

            return (
              <article
                key={project.id}
                className="group flex min-h-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/8"
              >
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 opacity-70 transition group-hover:opacity-100" />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
                        <BriefcaseBusiness size={21} />
                      </span>
                      <h2 className="line-clamp-2 text-lg font-bold leading-6 text-slate-900">
                        {project.title}
                      </h2>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLES[project.status] ||
                        STATUS_STYLES.archived
                      }`}
                    >
                      {getProjectStatusLabel(project.status)}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="mt-5 space-y-3">
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                        <BriefcaseBusiness size={13} />
                        Roles
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {projectRoles.length > 0 ? (
                          <>
                            {projectRoles.slice(0, 3).map((role) => (
                              <span
                                key={role}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                              >
                                {role}
                              </span>
                            ))}
                            {projectRoles.length > 3 && (
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                +{projectRoles.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No roles listed
                          </span>
                        )}
                      </div>
                    </div>

                    {projectSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {projectSkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                          >
                            <Sparkles size={11} />
                            {skill}
                          </span>
                        ))}
                        {projectSkills.length > 3 && (
                          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-500">
                            +{projectSkills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays size={14} />
                      {new Date(project.created_at).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </span>

                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition group-hover:text-indigo-700"
                    >
                      View project
                      <ArrowUpRight
                        size={16}
                        className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
