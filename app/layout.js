import './globals.css'

export const metadata = {
  title: 'Career Brain',
  description: 'Upload your CV, find your match, close the gap.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}