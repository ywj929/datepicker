"use client"

import type React from "react"
import { useState, useEffect, useRef, type KeyboardEvent, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createPortal } from "react-dom"

interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: Date
  onChange?: (date: Date) => void
  className?: string
  // New props
  disabled?: boolean
  disabledDate?: (date: Date) => boolean
  format?: string | ((date: Date) => string)
  dateRender?: (date: Date, today: Date) => React.ReactNode
  showToday?: boolean
  getCalendarContainer?: () => HTMLElement
}

type ViewMode = "calendar" | "year"

export default function DatePicker({
  value,
  onChange,
  className = "",
  disabled = false,
  disabledDate,
  format,
  dateRender,
  showToday = true,
  getCalendarContainer,
  ...restProps
}: DatePickerProps) {
  const [currentDate, setCurrentDate] = useState(value || new Date())
  const [viewDate, setViewDate] = useState(new Date(currentDate))
  const [isOpen, setIsOpen] = useState(false)
  const [focusedDay, setFocusedDay] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const calendarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLButtonElement>(null)
  const daysRef = useRef<(HTMLButtonElement | null)[]>([])
  const yearsRef = useRef<(HTMLButtonElement | null)[]>([])
  const [popupContainer, setPopupContainer] = useState<HTMLElement | null>(null)

  // Initialize popup container
  useEffect(() => {
    if (getCalendarContainer) {
      setPopupContainer(getCalendarContainer())
    } else {
      setPopupContainer(null)
    }
  }, [getCalendarContainer])

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Format date as string
  const formatDate = (date: Date) => {
    if (format) {
      if (typeof format === "function") {
        return format(date)
      }

      // Simple format implementation
      return format
        .replace("YYYY", date.getFullYear().toString())
        .replace("MM", (date.getMonth() + 1).toString().padStart(2, "0"))
        .replace("DD", date.getDate().toString().padStart(2, "0"))
        .replace("M", (date.getMonth() + 1).toString())
        .replace("D", date.getDate().toString())
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  // Check if a date is disabled
  const isDateDisabled = useCallback(
    (date: Date) => {
      if (disabledDate) {
        return disabledDate(date)
      }
      return false
    },
    [disabledDate],
  )

  // Handle date selection
  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)

    // Don't select if date is disabled
    if (isDateDisabled(newDate)) {
      return
    }

    setCurrentDate(newDate)
    onChange?.(newDate)
    setIsOpen(false)
  }

  // Handle year selection
  const handleSelectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1))
    setViewMode("calendar")
  }

  // Navigate to previous month
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    setFocusedDay(null)
  }

  // Navigate to next month
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
    setFocusedDay(null)
  }

  // Navigate to previous year set
  const prevYearSet = () => {
    setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1))
  }

  // Navigate to next year set
  const nextYearSet = () => {
    setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return

    if (viewMode === "year") {
      handleYearKeyDown(e)
      return
    }

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth())
    const firstDayOfMonth = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth())

    // If no day is focused yet, focus on the current day or first day
    if (focusedDay === null) {
      if (viewDate.getMonth() === currentDate.getMonth() && viewDate.getFullYear() === currentDate.getFullYear()) {
        setFocusedDay(currentDate.getDate())
      } else {
        setFocusedDay(1)
      }
      return
    }

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault()
        if (focusedDay > 1) {
          setFocusedDay(focusedDay - 1)
        } else {
          // Go to previous month, last day
          prevMonth()
          const prevMonthDays = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth() - 1)
          setFocusedDay(prevMonthDays)
        }
        break
      case "ArrowRight":
        e.preventDefault()
        if (focusedDay < daysInMonth) {
          setFocusedDay(focusedDay + 1)
        } else {
          // Go to next month, first day
          nextMonth()
          setFocusedDay(1)
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (focusedDay > 7) {
          setFocusedDay(focusedDay - 7)
        } else {
          // Go to previous month
          prevMonth()
          const prevMonthDays = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth() - 1)
          const newDay = prevMonthDays - (7 - focusedDay)
          setFocusedDay(newDay > 0 ? newDay : prevMonthDays)
        }
        break
      case "ArrowDown":
        e.preventDefault()
        if (focusedDay + 7 <= daysInMonth) {
          setFocusedDay(focusedDay + 7)
        } else {
          // Go to next month
          nextMonth()
          const newDay = focusedDay + 7 - daysInMonth
          setFocusedDay(newDay <= getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth() + 1) ? newDay : 1)
        }
        break
      case "Home":
        e.preventDefault()
        // Go to first day of current week
        const currentWeekStart = focusedDay - ((focusedDay - 1) % 7)
        setFocusedDay(currentWeekStart)
        break
      case "End":
        e.preventDefault()
        // Go to last day of current week
        const currentWeekEnd = Math.min(focusedDay + (7 - (focusedDay % 7)), daysInMonth)
        setFocusedDay(currentWeekEnd === 0 ? 7 : currentWeekEnd)
        break
      case "PageUp":
        e.preventDefault()
        prevMonth()
        break
      case "PageDown":
        e.preventDefault()
        nextMonth()
        break
      case "Enter":
      case " ":
        e.preventDefault()
        handleSelectDate(focusedDay)
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        break
      default:
        break
    }
  }

  // Handle keyboard navigation for year view
  const handleYearKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const startYear = viewDate.getFullYear() - (viewDate.getFullYear() % 12)
    const focusedYearIndex = yearsRef.current.findIndex((ref) => document.activeElement === ref)
    const focusedYear = focusedYearIndex !== -1 ? startYear + focusedYearIndex : startYear

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault()
        if (focusedYearIndex > 0) {
          yearsRef.current[focusedYearIndex - 1]?.focus()
        } else {
          prevYearSet()
        }
        break
      case "ArrowRight":
        e.preventDefault()
        if (focusedYearIndex < 11) {
          yearsRef.current[focusedYearIndex + 1]?.focus()
        } else {
          nextYearSet()
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (focusedYearIndex >= 4) {
          yearsRef.current[focusedYearIndex - 4]?.focus()
        } else {
          prevYearSet()
        }
        break
      case "ArrowDown":
        e.preventDefault()
        if (focusedYearIndex < 8) {
          yearsRef.current[focusedYearIndex + 4]?.focus()
        } else {
          nextYearSet()
        }
        break
      case "Enter":
      case " ":
        e.preventDefault()
        if (focusedYearIndex !== -1) {
          handleSelectYear(startYear + focusedYearIndex)
        }
        break
      case "Escape":
        e.preventDefault()
        if (viewMode === "year") {
          setViewMode("calendar")
        } else {
          setIsOpen(false)
        }
        break
      case "PageUp":
        e.preventDefault()
        prevYearSet()
        break
      case "PageDown":
        e.preventDefault()
        nextYearSet()
        break
      default:
        break
    }
  }

  // Focus the button for the focused day
  useEffect(() => {
    if (focusedDay !== null && isOpen && viewMode === "calendar") {
      const index = focusedDay - 1
      if (daysRef.current[index]) {
        daysRef.current[index]?.focus()
      }
    }
  }, [focusedDay, isOpen, viewMode])

  // Close the calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Reset refs when month changes
  useEffect(() => {
    daysRef.current = daysRef.current.slice(0, getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()))
    yearsRef.current = new Array(12).fill(null)
  }, [viewDate])

  // Reset view mode when closing
  useEffect(() => {
    if (!isOpen) {
      setViewMode("calendar")
    }
  }, [isOpen])

  // Update current date when value prop changes
  useEffect(() => {
    if (value) {
      setCurrentDate(value)
      setViewDate(new Date(value))
    }
  }, [value])

  // Render calendar days
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth())
    const firstDayOfMonth = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth())
    const today = new Date()
    const days = []

    // Add days from previous month
    const prevMonthDays = getDaysInMonth(
      viewDate.getMonth() === 0 ? viewDate.getFullYear() - 1 : viewDate.getFullYear(),
      viewDate.getMonth() === 0 ? 11 : viewDate.getMonth() - 1,
    )

    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = prevMonthDays - firstDayOfMonth + i + 1
      const date = new Date(
        viewDate.getMonth() === 0 ? viewDate.getFullYear() - 1 : viewDate.getFullYear(),
        viewDate.getMonth() === 0 ? 11 : viewDate.getMonth() - 1,
        day,
      )

      days.push(
        <button
          key={`prev-${day}`}
          disabled
          className="h-10 w-10 rounded-md flex items-center justify-center text-slate-300"
          aria-hidden="true"
        >
          {dateRender ? dateRender(date, today) : day}
        </button>,
      )
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
      const isCurrentDay = isSameDay(date, currentDate)
      const isToday = isSameDay(date, today)
      const isDisabled = isDateDisabled(date)

      days.push(
        <button
          key={day}
          ref={(el) => (daysRef.current[day - 1] = el)}
          onClick={() => handleSelectDate(day)}
          disabled={isDisabled}
          className={`h-10 w-10 rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 
            ${isCurrentDay ? "bg-slate-900 text-white hover:bg-slate-700" : "hover:bg-slate-100"} 
            ${isToday && !isCurrentDay ? "border border-slate-400" : ""}
            ${isDisabled ? "opacity-50 cursor-not-allowed bg-slate-100 hover:bg-slate-100" : ""}`}
          aria-selected={isCurrentDay}
          aria-current={isToday ? "date" : undefined}
          aria-disabled={isDisabled}
        >
          {dateRender ? dateRender(date, today) : day}
        </button>,
      )
    }

    // Add days from next month
    const totalCells = 42 // 6 rows of 7 days
    const nextMonthDays = totalCells - days.length

    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(
        viewDate.getMonth() === 11 ? viewDate.getFullYear() + 1 : viewDate.getFullYear(),
        viewDate.getMonth() === 11 ? 0 : viewDate.getMonth() + 1,
        day,
      )

      days.push(
        <button
          key={`next-${day}`}
          disabled
          className="h-10 w-10 rounded-md flex items-center justify-center text-slate-300"
          aria-hidden="true"
        >
          {dateRender ? dateRender(date, today) : day}
        </button>,
      )
    }

    return days
  }

  // Render year selection
  const renderYearSelection = () => {
    const startYear = viewDate.getFullYear() - (viewDate.getFullYear() % 12)
    const years = []
    const today = new Date()

    for (let i = 0; i < 12; i++) {
      const year = startYear + i
      const isCurrentYear = year === currentDate.getFullYear()
      const isThisYear = year === today.getFullYear()

      years.push(
        <button
          key={year}
          ref={(el) => (yearsRef.current[i] = el)}
          onClick={() => handleSelectYear(year)}
          className={`h-16 w-16 rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 
            ${isCurrentYear ? "bg-slate-900 text-white hover:bg-slate-700" : "hover:bg-slate-100"}
            ${isThisYear && !isCurrentYear ? "border border-slate-400" : ""}`}
          aria-selected={isCurrentYear}
        >
          {year}
        </button>,
      )
    }

    return years
  }

  // Render the calendar popup
  const renderCalendarPopup = () => {
    const popup = (
      <div
        ref={calendarRef}
        className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg p-4 w-[336px]"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={viewMode === "calendar" ? "Calendar" : "Year selection"}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={viewMode === "calendar" ? prevMonth : prevYearSet}
            className="p-2 hover:bg-slate-100 rounded-full"
            aria-label={viewMode === "calendar" ? "Previous month" : "Previous years"}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "calendar" ? "year" : "calendar")}
            className="text-lg font-semibold px-2 py-1 hover:bg-slate-100 rounded-md"
          >
            {viewMode === "calendar"
              ? viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : `${viewDate.getFullYear() - (viewDate.getFullYear() % 12)} - ${viewDate.getFullYear() - (viewDate.getFullYear() % 12) + 11}`}
          </button>
          <button
            type="button"
            onClick={viewMode === "calendar" ? nextMonth : nextYearSet}
            className="p-2 hover:bg-slate-100 rounded-full"
            aria-label={viewMode === "calendar" ? "Next month" : "Next years"}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {viewMode === "calendar" ? (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="h-10 w-10 flex items-center justify-center text-sm font-medium text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
          </>
        ) : (
          <div className="grid grid-cols-4 gap-2 py-2">{renderYearSelection()}</div>
        )}

        {showToday && (
          <div className="mt-4 text-right">
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                if (!isDateDisabled(today)) {
                  setCurrentDate(today)
                  setViewDate(today)
                  onChange?.(today)
                  setIsOpen(false)
                }
              }}
              className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Today
            </button>
          </div>
        )}
      </div>
    )

    // Render in a portal if getCalendarContainer is provided
    if (popupContainer) {
      return createPortal(popup, popupContainer)
    }

    return popup
  }

  return (
    <div className={`relative inline-block ${className}`} {...restProps}>
      <button
        ref={inputRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        {formatDate(currentDate)}
      </button>

      {isOpen && renderCalendarPopup()}
    </div>
  )
}
