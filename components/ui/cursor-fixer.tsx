'use client'

import { useEffect } from 'react'

export function CursorFixer() {
    useEffect(() => {
        // Create a style element
        const style = document.createElement('style')
        style.innerHTML = `
      button, 
      [role="button"], 
      [type="button"], 
      [type="submit"], 
      [type="reset"], 
      .cursor-pointer {
        cursor: pointer !important;
      }
    `
        // Append to head
        document.head.appendChild(style)

        // Cleanup not strictly necessary for a global fix, but good practice if it were scoped
        return () => {
            document.head.removeChild(style)
        }
    }, [])

    return null
}
