import { useState, useEffect } from 'react'

export function useNavbarSolid(threshold = 80) {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setSolid(window.scrollY > threshold)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return solid
}
