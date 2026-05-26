import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function Latex({ math, displayMode = false, className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    try {
      katex.render(String(math || '').trim(), containerRef.current, {
        displayMode,
        throwOnError: false,
        trust: true,
      })
    } catch {
      containerRef.current.textContent = math || ''
    }
  }, [math, displayMode])

  return <span ref={containerRef} className={className} />
}
