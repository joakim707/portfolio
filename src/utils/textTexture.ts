import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

export interface SignStyle {
  width?: number
  height?: number
  background?: string
  color?: string
  accent?: string
  font?: string
  subFont?: string
  border?: number
}

/**
 * Signs are drawn on a canvas instead of SDF text so the park works fully
 * offline (no font fetch from a CDN at runtime). The texture is redrawn once
 * the web font has loaded.
 */
export function useSignTexture(title: string, subtitle = '', style: SignStyle = {}) {
  const {
    width = 1024,
    height = 256,
    background = '#141428',
    color = '#ffffff',
    accent = '#ff4d6d',
    font = 'Bungee',
    subFont = 'Inter',
    border = 14,
  } = style

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [width, height])

  useEffect(() => {
    const draw = () => {
      const canvas = texture.image as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = accent
      ctx.lineWidth = border
      ctx.strokeRect(border / 2, border / 2, width - border, height - border)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = color
      const titleY = subtitle ? height * 0.42 : height / 2
      let size = Math.floor(height * (subtitle ? 0.36 : 0.5))
      ctx.font = `${size}px ${font}, Impact, sans-serif`
      while (ctx.measureText(title).width > width * 0.88 && size > 10) {
        size -= 2
        ctx.font = `${size}px ${font}, Impact, sans-serif`
      }
      ctx.fillText(title, width / 2, titleY)
      if (subtitle) {
        ctx.fillStyle = accent
        ctx.font = `600 ${Math.floor(height * 0.16)}px ${subFont}, sans-serif`
        ctx.fillText(subtitle, width / 2, height * 0.76)
      }
      texture.needsUpdate = true
    }
    draw()
    let cancelled = false
    document.fonts?.load(`64px ${font}`).then(() => !cancelled && draw()).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [texture, title, subtitle, width, height, background, color, accent, font, subFont, border])

  useEffect(() => () => texture.dispose(), [texture])
  return texture
}
