"use client"

import * as React from "react"
import { cn } from "@/app/utils/utils"

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end"
  className?: string
}

export function Dropdown({ trigger, children, align = "start", className }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "absolute z-50 min-w-[200px] rounded-md border border-gray-600 bg-gray-900 p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
            "top-full mt-1",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function DropdownItem({ children, className, ...props }: DropdownItemProps) {
  return (
    <div
      className={cn(
        "flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-white hover:bg-gray-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}