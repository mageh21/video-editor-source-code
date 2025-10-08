"use client"

import * as React from "react"
import { cn } from "@/app/utils/utils"

interface PopoverProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end" | "center"
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function Popover({ 
  trigger, 
  children, 
  align = "center", 
  side = "bottom",
  className 
}: PopoverProps) {
  const [open, setOpen] = React.useState(false)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const getPositionClasses = () => {
    const positions = {
      top: "bottom-full mb-2",
      bottom: "top-full mt-2",
      left: "right-full mr-2",
      right: "left-full ml-2",
    }

    const alignments = {
      start: {
        top: "left-0",
        bottom: "left-0",
        left: "top-0",
        right: "top-0",
      },
      center: {
        top: "left-1/2 transform -translate-x-1/2",
        bottom: "left-1/2 transform -translate-x-1/2",
        left: "top-1/2 transform -translate-y-1/2",
        right: "top-1/2 transform -translate-y-1/2",
      },
      end: {
        top: "right-0",
        bottom: "right-0",
        left: "bottom-0",
        right: "bottom-0",
      },
    }

    return `${positions[side]} ${alignments[align][side]}`
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "absolute z-50 min-w-[200px] rounded-md border border-gray-600 bg-gray-900 p-3 shadow-lg",
            getPositionClasses(),
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}