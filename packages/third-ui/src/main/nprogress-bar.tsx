'use client';

import NProgress from 'nprogress'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

// remove NProgress progress bar spinner circle
NProgress.configure({ showSpinner: false })

export function NProgressBar() {
  const pathname = usePathname()
  const previousPath = useRef(pathname)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      NProgress.start()
      setTimeout(() => {
        NProgress.done()
      }, 100)
      previousPath.current = pathname
    }
  }, [pathname])

  return null
} 