import React, { useEffect, useRef, useState } from 'react'
import PronunciationControls from './PronunciationControls'

export default function TracePad({ item, onDone, onClose }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const drawGuide = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.max(640, Math.floor(rect.width * ratio))
    canvas.height = Math.floor(330 * ratio)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f7f9fc'
    ctx.fillRect(0, 0, rect.width, 330)
    ctx.font = '900 86px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = '#d7deea'
    ctx.lineWidth = 3
    ctx.setLineDash([9, 8])
    ctx.strokeText(item.word, rect.width / 2, 165)
    ctx.setLineDash([])
  }

  useEffect(() => {
    drawGuide()
    const resize = () => drawGuide()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [item.word])

  const position = event => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const point = event.touches?.[0] || event
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  const start = event => {
    event.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const p = position(event)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.strokeStyle = '#2858a8'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setDrawing(true)
    setHasDrawn(true)
  }

  const move = event => {
    if (!drawing) return
    event.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const p = position(event)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  const stop = event => {
    event?.preventDefault?.()
    setDrawing(false)
  }

  const clear = () => {
    setHasDrawn(false)
    drawGuide()
  }

  return (
    <div className="guided-overlay">
      <div className="trace-shell">
        <header className="trace-header">
          <button className="ghost" onClick={onClose}>× Salir</button>
          <div><p className="kicker">MISIÓN DE PRECISIÓN</p><h2>Repasá {item.word}</h2></div>
        </header>
        <PronunciationControls item={item} />
        <p className="muted">Seguí las letras punteadas con el dedo o lápiz táctil. Esta actividad practica el movimiento; no califica si la letra quedó “linda”.</p>
        <canvas
          ref={canvasRef}
          className="trace-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
        />
        <div className="trace-actions">
          <button className="secondary" onClick={clear}>↺ Borrar</button>
          <button className="primary" disabled={!hasDrawn} onClick={() => onDone(item)}>✓ Terminé</button>
        </div>
      </div>
    </div>
  )
}
