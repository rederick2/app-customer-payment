'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DraggablePopupProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
  initialPosition?: { x: number, y: number }
}

export function DraggablePopup({
  isOpen,
  onClose,
  children,
  title,
  className,
  initialPosition
}: DraggablePopupProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const popupRef = React.useRef<HTMLDivElement>(null)

  // Set initial position once
  React.useEffect(() => {
    if (isOpen) {
      if (initialPosition) {
        setPosition(initialPosition)
      } else {
        // Default to center if no position provided
        setPosition({
          x: window.innerWidth / 2 - 160, // approx half width of w-80
          y: window.innerHeight / 2 - 200
        })
      }
    }
  }, [isOpen, initialPosition])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!popupRef.current) return
    setIsDragging(true)
    const rect = popupRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Boundary checks
      const x = Math.max(0, Math.min(newX, window.innerWidth - (popupRef.current?.offsetWidth || 0)))
      const y = Math.max(0, Math.min(newY, window.innerHeight - (popupRef.current?.offsetHeight || 0)))
      
      setPosition({ x, y })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  if (!isOpen) return null

  const content = (
    <div 
      className="fixed inset-0 z-[9999] pointer-events-none"
    >
      <div
        ref={popupRef}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          position: 'absolute'
        }}
        className={cn(
          "pointer-events-auto w-[350px] bg-card border border-border shadow-none rounded-xl overflow-hidden animate-in zoom-in-95 duration-200",
          className
        )}
      >
        {/* Header / Drag Handle */}
        <div 
          className="flex items-center gap-2 p-2 bg-muted/30 border-b border-border/50 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-1 opacity-40">
            <div className="grid grid-cols-2 gap-0.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-0.75 w-0.75 rounded-full bg-foreground" />
              ))}
            </div>
          </div>
          <div className="flex-1 truncate">
            {title && <span className="text-[10px] font-archivo font-black uppercase tracking-widest text-muted-foreground">{title}</span>}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[80vh] overflow-y-auto font-manrope">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
