"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure hydration match
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors opacity-50 cursor-default">
        <Sun className="mr-3 h-4 w-4" />
        <span>Theme</span>
      </button>
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
    >
      {isDark ? (
        <Moon className="mr-3 h-4 w-4" />
      ) : (
        <Sun className="mr-3 h-4 w-4" />
      )}
      <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
    </button>
  )
}
