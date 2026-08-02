import { useState, useEffect } from 'react'

/**
 * Custom hook to animate a numeric value from 0 to target value over a set duration.
 * Uses requestAnimationFrame for optimal performance.
 *
 * @param endVal The target number to count up to.
 * @param duration Duration of the animation in milliseconds.
 */
export function useCountUp(endVal: number, duration: number = 2000): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      setCount(Math.floor(progress * endVal))
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step)
      }
    }

    animationFrameId = window.requestAnimationFrame(step)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [endVal, duration])

  return count
}
