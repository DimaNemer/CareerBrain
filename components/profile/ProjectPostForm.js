
// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { theme } from '@/constants/colors'

// export default function ProjectPostForm({
//   completedProjects = [],
// }) {
//   const router = useRouter()

//   const [open, setOpen] = useState(false)
//   const [loading, setLoading] =
//     useState(false)
//   const [error, setError] = useState('')

//   const [form, setForm] = useState({
//     title: '',
//     content: '',
//     project_id: '',
//     skills_input: '',
//     visibility: 'public',
//   })

//   function handleChange(event) {
//     const { name, value } = event.target

//     setForm(previous => ({
//       ...previous,
//       [name]: value,
//     }))

//     setError('')
//   }

//   function closeForm() {
//     setOpen(false)
//     setError('')

//     setForm({
//       title: '',
//       content: '',
//       project_id: '',
//       skills_input: '',
//       visibility: 'public',
//     })
//   }

//   async function handleSubmit(event) {
//     event.preventDefault()

//     setLoading(true)
//     setError('')

//     const skills = form.skills_input
//       .split(',')
//       .map(skill => skill.trim())
//       .filter(Boolean)

//     try {
//       const response = await fetch(
//         '/api/profile/posts',
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type':
//               'application/json',
//           },
//           body: JSON.stringify({
//             title: form.title,
//             content: form.content,
//             project_id:
//               form.project_id || null,
//             skills_highlighted: skills,
//             visibility: form.visibility,
//           }),
//         }
//       )

//       const data = await response.json()

//       if (!response.ok) {
//         setError(
//           data.error ||
//             'Failed to publish post'
//         )
//         return
//       }

//       closeForm()
//       router.refresh()
//     } catch {
//       setError('Something went wrong')
//     } finally {
//       setLoading(false)
//     }
//   }

//   if (!open) {
//     return (
//       <button
//         type="button"
//         onClick={() => setOpen(true)}
//         style={{
//           width: '100%',
//           padding: '13px 15px',
//           background: '#F9FAFB',
//           border: '1px solid #E5E7EB',
//           borderRadius: '12px',
//           fontSize: '14px',
//           color: '#6B7280',
//           cursor: 'pointer',
//           textAlign: 'left',
//           fontFamily: 'inherit',
//         }}
//       >
//         ✏️ Share a completed project,
//         achievement, or learning experience...
//       </button>
//     )
//   }

//   return (
//     <form
//       onSubmit={handleSubmit}
//       style={{
//         background: '#F9FAFB',
//         border: `1px solid ${theme.border.focus}`,
//         borderRadius: '14px',
//         padding: '17px',
//         display: 'flex',
//         flexDirection: 'column',
//         gap: '12px',
//       }}
//     >
//       <div>
//         <h3
//           style={{
//             margin: 0,
//             fontSize: '14px',
//             color: '#111827',
//           }}
//         >
//           Create post
//         </h3>

//         <p
//           style={{
//             margin: '4px 0 0',
//             color: '#9CA3AF',
//             fontSize: '11px',
//           }}
//         >
//           Share completed work without
//           exposing unfinished projects.
//         </p>
//       </div>

//       {error && (
//         <div
//           style={{
//             padding: '9px 11px',
//             background: '#FEF2F2',
//             color: '#DC2626',
//             borderRadius: '8px',
//             fontSize: '12px',
//           }}
//         >
//           {error}
//         </div>
//       )}

//       <input
//         name="title"
//         required
//         maxLength={150}
//         placeholder="Post title"
//         value={form.title}
//         onChange={handleChange}
//         style={inputStyle}
//       />

//       <textarea
//         name="content"
//         required
//         maxLength={2000}
//         placeholder="What did you build or achieve?"
//         value={form.content}
//         onChange={handleChange}
//         rows={5}
//         style={{
//           ...inputStyle,
//           resize: 'vertical',
//           lineHeight: 1.6,
//         }}
//       />

//       <div
//         style={{
//           display: 'grid',
//           gridTemplateColumns:
//             'repeat(auto-fit, minmax(190px, 1fr))',
//           gap: '10px',
//         }}
//       >
//         <select
//           name="project_id"
//           value={form.project_id}
//           onChange={handleChange}
//           style={{
//             ...inputStyle,
//             cursor: 'pointer',
//           }}
//         >
//           <option value="">
//             Link completed project
//             (optional)
//           </option>

//           {completedProjects.map(project => (
//             <option
//               key={project.id}
//               value={project.id}
//             >
//               {project.title}
//             </option>
//           ))}
//         </select>

//         <select
//           name="visibility"
//           value={form.visibility}
//           onChange={handleChange}
//           style={{
//             ...inputStyle,
//             cursor: 'pointer',
//           }}
//         >
//           <option value="public">
//             Public
//           </option>

//           <option value="team">
//             Team members only
//           </option>

//           <option value="private">
//             Only me
//           </option>
//         </select>
//       </div>

//       <input
//         name="skills_input"
//         placeholder="Skills used, separated by commas"
//         value={form.skills_input}
//         onChange={handleChange}
//         style={inputStyle}
//       />

//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'flex-end',
//           gap: '8px',
//         }}
//       >
//         <button
//           type="button"
//           onClick={closeForm}
//           disabled={loading}
//           style={{
//             padding: '8px 13px',
//             background: '#FFFFFF',
//             border: '1px solid #E5E7EB',
//             borderRadius: '8px',
//             fontSize: '12px',
//             cursor: 'pointer',
//             color: '#4B5563',
//           }}
//         >
//           Cancel
//         </button>

//         <button
//           type="submit"
//           disabled={loading}
//           style={{
//             padding: '8px 15px',
//             background:
//               theme.action.primary,
//             color: '#FFFFFF',
//             border: 'none',
//             borderRadius: '8px',
//             fontSize: '12px',
//             fontWeight: 600,
//             cursor: loading
//               ? 'not-allowed'
//               : 'pointer',
//             opacity: loading ? 0.7 : 1,
//           }}
//         >
//           {loading
//             ? 'Publishing...'
//             : 'Publish'}
//         </button>
//       </div>
//     </form>
//   )
// }

// const inputStyle = {
//   width: '100%',
//   boxSizing: 'border-box',
//   padding: '10px 12px',
//   border: '1px solid #E5E7EB',
//   borderRadius: '9px',
//   fontSize: '13px',
//   outline: 'none',
//   fontFamily: 'inherit',
//   background: '#FFFFFF',
//   color: '#111827',
// }
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/constants/colors'

export default function ProjectPostForm({
  completedProjects = [],
}) {
  const router = useRouter()
  const imageInputRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] =
    useState(false)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] =
    useState(null)
  const [imagePreview, setImagePreview] =
    useState('')

  const [form, setForm] = useState({
    title: '',
    content: '',
    project_id: '',
    skills_input: '',
  })

  function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value,
    }))

    setError('')
  }

  function handleImageChange(event) {
    const file =
      event.target.files?.[0]

    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Please select a JPG, PNG, or WebP image'
      )

      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'Post image must be under 5MB'
      )

      event.target.value = ''
      return
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setSelectedImage(file)
    setImagePreview(
      URL.createObjectURL(file)
    )
    setError('')
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setSelectedImage(null)
    setImagePreview('')

    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  function resetForm() {
    setForm({
      title: '',
      content: '',
      project_id: '',
      skills_input: '',
    })

    removeImage()
    setError('')
  }

  function closeForm() {
    resetForm()
    setOpen(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setError('')

    const skills = form.skills_input
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean)

    const formData = new FormData()

    formData.append(
      'title',
      form.title
    )

    formData.append(
      'content',
      form.content
    )

    formData.append(
      'project_id',
      form.project_id
    )

    formData.append(
      'skills_highlighted',
      JSON.stringify(skills)
    )

    if (selectedImage) {
      formData.append(
        'image',
        selectedImage
      )
    }

    try {
      const response = await fetch(
        '/api/profile/posts',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error(
          'Create post response:',
          data
        )

        setError(
          data.error ||
            'Failed to publish post'
        )

        return
      }

      resetForm()
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error(
        'Create post request error:',
        error
      )

      setError(
        'Something went wrong while publishing'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          padding: '13px 15px',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          fontSize: '14px',
          color: '#6B7280',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        ✏️ Share a completed project,
        achievement, or learning experience...
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#F9FAFB',
        border: `1px solid ${theme.border.focus}`,
        borderRadius: '14px',
        padding: '17px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#111827',
          }}
        >
          Create post
        </h3>

        <p
          style={{
            margin: '4px 0 0',
            color: '#9CA3AF',
            fontSize: '11px',
          }}
        >
          Share a project, screenshot, achievement,
          or learning experience.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '9px 11px',
            background: '#FEF2F2',
            color: '#DC2626',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        >
          {error}
        </div>
      )}

      <input
        name="title"
        required
        maxLength={150}
        placeholder="Post title"
        value={form.title}
        onChange={handleChange}
        style={inputStyle}
      />

      <textarea
        name="content"
        required
        maxLength={2000}
        placeholder="What did you build or achieve?"
        value={form.content}
        onChange={handleChange}
        rows={5}
        style={{
          ...inputStyle,
          resize: 'vertical',
          lineHeight: 1.6,
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '10px',
        }}
      >
        <select
          name="project_id"
          value={form.project_id}
          onChange={handleChange}
          style={{
            ...inputStyle,
            cursor: 'pointer',
          }}
        >
          <option value="">
            Link completed project (optional)
          </option>

          {completedProjects.map(project => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.title}
            </option>
          ))}
        </select>

        <input
          name="skills_input"
          placeholder="Skills, separated by commas"
          value={form.skills_input}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      <div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />

        {!imagePreview ? (
          <button
            type="button"
            onClick={() =>
              imageInputRef.current?.click()
            }
            style={{
              padding: '9px 13px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '9px',
              color: '#4B5563',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            🖼️ Add project image
          </button>
        ) : (
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
            }}
          >
            <img
              src={imagePreview}
              alt="Post preview"
              style={{
                display: 'block',
                width: '100%',
                maxHeight: '340px',
                objectFit: 'cover',
              }}
            />

            <button
              type="button"
              onClick={removeImage}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: 'none',
                background:
                  'rgba(17,24,39,0.8)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={closeForm}
          disabled={loading}
          style={{
            padding: '8px 13px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#4B5563',
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 15px',
            background:
              theme.action.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: loading
              ? 'not-allowed'
              : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? 'Publishing...'
            : 'Publish'}
        </button>
      </div>
    </form>
  )
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: '9px',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'inherit',
  background: '#FFFFFF',
  color: '#111827',
}