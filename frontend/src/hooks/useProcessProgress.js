import { useCallback, useRef, useState } from 'react'

export default function useProcessProgress() {
  const [active, setActive] = useState(false)
  const [percent, setPercent] = useState(0)
  const [label, setLabel] = useState('')
  const timerRef = useRef(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback((labelText, estimatedMs = 20000) => {
    stopTimer()
    setActive(true)
    setPercent(4)
    setLabel(labelText)
    const started = Date.now()
    const duration = Math.max(8000, estimatedMs)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - started
      setPercent(Math.min(90, 4 + Math.round((elapsed / duration) * 86)))
    }, 250)
  }, [stopTimer])

  const update = useCallback((nextPercent, labelText) => {
    if (labelText) setLabel(labelText)
    setActive(true)
    setPercent(Math.max(0, Math.min(99, Math.round(nextPercent))))
  }, [])

  const finish = useCallback((labelText) => {
    stopTimer()
    if (labelText) setLabel(labelText)
    setPercent(100)
    setTimeout(() => {
      setActive(false)
      setPercent(0)
      setLabel('')
    }, 700)
  }, [stopTimer])

  const reset = useCallback(() => {
    stopTimer()
    setActive(false)
    setPercent(0)
    setLabel('')
  }, [stopTimer])

  return { active, percent, label, start, update, finish, reset }
}
