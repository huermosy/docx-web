import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  tint: 'blue' | 'cyan' | 'violet'
}

interface ParticleBackgroundProps {
  enabled?: boolean
}

const MAX_PARTICLES = 90
const MIN_PARTICLES = 36
const LINK_DISTANCE = 120
const MOUSE_DISTANCE = 150

export function ParticleBackground({ enabled = true }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = mediaQuery.matches
    let running = true
    let rafId = 0

    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
    }

    const particles: Particle[] = []

    const getParticleCount = () => {
      const area = window.innerWidth * window.innerHeight
      const byArea = Math.floor(area / 26000)
      return Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, byArea))
    }

    const randomTint = (): Particle['tint'] => {
      const seed = Math.random()
      if (seed < 0.74) return 'blue'
      if (seed < 0.9) return 'cyan'
      return 'violet'
    }

    const getParticleColor = (particle: Particle, nearMouse: boolean) => {
      if (particle.tint === 'cyan') {
        return nearMouse ? 'rgba(34, 211, 238, 0.28)' : 'rgba(34, 211, 238, 0.18)'
      }
      if (particle.tint === 'violet') {
        return nearMouse ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.14)'
      }
      return nearMouse ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
    }

    const seedParticles = () => {
      particles.length = 0
      const count = getParticleCount()
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: 0.8 + Math.random() * 1.8,
          tint: randomTint(),
        })
      }
    }

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(window.innerWidth * ratio)
      canvas.height = Math.floor(window.innerHeight * ratio)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      seedParticles()
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = getParticleColor(p, false)
        ctx.fill()
      }
    }

    const animate = () => {
      if (!running) {
        return
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const allowMotion = enabled && !reducedMotion

      for (const p of particles) {
        let nearMouse = false

        if (allowMotion) {
          p.x += p.vx
          p.y += p.vy

          if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1
          if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1

          if (mouse.active) {
            const dx = mouse.x - p.x
            const dy = mouse.y - p.y
            const dist = Math.hypot(dx, dy)
            nearMouse = dist < MOUSE_DISTANCE
            if (nearMouse) {
              const force = (MOUSE_DISTANCE - dist) / MOUSE_DISTANCE
              p.x -= (dx / Math.max(dist, 1)) * force * 0.45
              p.y -= (dy / Math.max(dist, 1)) * force * 0.45
            }
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = getParticleColor(p, nearMouse)
        ctx.fill()
      }

      if (allowMotion) {
        for (let i = 0; i < particles.length; i += 1) {
          for (let j = i + 1; j < particles.length; j += 1) {
            const a = particles[i]
            const b = particles[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const distance = Math.hypot(dx, dy)
            if (distance < LINK_DISTANCE) {
              const alpha = (1 - distance / LINK_DISTANCE) * 0.1
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`
              ctx.lineWidth = 1
              ctx.stroke()
            }
          }
        }
      }

      rafId = window.requestAnimationFrame(animate)
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        running = false
        window.cancelAnimationFrame(rafId)
      } else if (!running) {
        running = true
        if (!enabled || reducedMotion) {
          drawStatic()
        } else {
          rafId = window.requestAnimationFrame(animate)
        }
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX
      mouse.y = event.clientY
      mouse.active = true
    }

    const onMouseLeave = () => {
      mouse.active = false
    }

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches
      if (reducedMotion || !enabled) {
        window.cancelAnimationFrame(rafId)
        drawStatic()
      } else if (running) {
        rafId = window.requestAnimationFrame(animate)
      }
    }

    resize()

    if (!enabled || reducedMotion) {
      drawStatic()
    } else {
      rafId = window.requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)
    mediaQuery.addEventListener('change', onMotionChange)

    return () => {
      running = false
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      mediaQuery.removeEventListener('change', onMotionChange)
    }
  }, [enabled])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-90" />
}
