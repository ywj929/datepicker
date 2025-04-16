"use client"

import type React from "react"
import { useState, useEffect, useRef, type KeyboardEvent, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createPortal } from "react-dom"
import styled, { StyleSheetManager } from "styled-components"
import moment from "moment"
import type { Moment } from "moment"

// 添加shouldForwardProp函数来解决styled-components警告
const shouldForwardProp = (prop: string) => !prop.startsWith('$');

// Styled components
const DatePickerContainer = styled.div`
  position: relative;
  display: inline-block;
  width: ${(props) => props.width || "auto"};
`

// Update the DatePickerInput focus style
const DatePickerInput = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #4338ca; /* Darker indigo color with higher contrast */
    border-color: #4338ca;
  }
  
  ${(props) =>
    props.$disabled &&
    `
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f1f5f9;
  `}
`

const CalendarPopup = styled.div`
  position: absolute;
  z-index: 10;
  margin-top: 0.25rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  width: 336px;
`

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`

// Update the IconButton and MonthYearButton focus styles
const IconButton = styled.button`
  padding: 0.5rem;
  border-radius: 9999px;
  
  &:hover {
    background-color: #f1f5f9;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #4338ca; /* Darker indigo color with higher contrast */
  }
`

const MonthYearButton = styled.button`
  font-size: 1.125rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  
  &:hover {
    background-color: #f1f5f9;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #4338ca; /* Darker indigo color with higher contrast */
  }
`

const WeekdaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
`

const WeekdayLabel = styled.div`
  height: 2.5rem;
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
`

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
`

const YearsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 0.5rem 0;
`

// Update the DayButton focus style
const DayButton = styled.button<{
  $isCurrentDay?: boolean
  $isToday?: boolean
  $isDisabled?: boolean
  $isAdjacentMonth?: boolean
}>`
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #4338ca; /* Darker indigo color with higher contrast */
    position: relative;
    z-index: 1; /* Ensure focus ring is visible */
  }
  
  ${(props) =>
    props.$isCurrentDay &&
    `
    background-color: #0f172a;
    color: white;
    
    &:hover {
      background-color: #1e293b;
    }
  `}
  
  ${(props) =>
    !props.$isCurrentDay &&
    !props.$isDisabled &&
    !props.$isAdjacentMonth &&
    `
    &:hover {
      background-color: #f1f5f9;
    }
  `}
  
  ${(props) =>
    props.$isToday &&
    !props.$isCurrentDay &&
    `
    border: 1px solid #94a3b8;
  `}
  
  ${(props) =>
    props.$isDisabled &&
    `
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f1f5f9;
    
    &:hover {
      background-color: #f1f5f9;
    }
  `}
  
  ${(props) =>
    props.$isAdjacentMonth &&
    `
    color: #cbd5e1;
  `}
`

// Update the YearButton focus style
const YearButton = styled.button<{ $isCurrentYear?: boolean; $isThisYear?: boolean }>`
  height: 4rem;
  width: 4rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #4338ca; /* Darker indigo color with higher contrast */
    position: relative;
    z-index: 1; /* Ensure focus ring is visible */
  }
  
  ${(props) =>
    props.$isCurrentYear &&
    `
    background-color: #0f172a;
    color: white;
    
    &:hover {
      background-color: #1e293b;
    }
  `}
  
  ${(props) =>
    !props.$isCurrentYear &&
    `
    &:hover {
      background-color: #f1f5f9;
    }
  `}
  
  ${(props) =>
    props.$isThisYear &&
    !props.$isCurrentYear &&
    `
    border: 1px solid #94a3b8;
  `}
`

// Update the TodayButton focus style
const TodayButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  border-radius: 0.375rem;
  
  &:hover {
    background-color: #f1f5f9;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #4338ca; /* Darker indigo color with higher contrast */
  }
`

const FooterContainer = styled.div`
  margin-top: 1rem;
  text-align: right;
`

interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: Moment | string
  onChange?: (date: Moment) => void
  className?: string
  disabled?: boolean
  disabledDate?: (date: Moment) => boolean
  format?: string
  dateRender?: (date: Moment, today: Moment) => React.ReactNode
  showToday?: boolean
  width?: string
}

type ViewMode = "calendar" | "year"

export default function DatePicker({
  value,
  onChange,
  className = "",
  disabled = false,
  disabledDate,
  format = "MMMM D, YYYY",
  dateRender,
  showToday = true,
  width,
  ...restProps
}: DatePickerProps) {
  // Parse string or moment to moment object
  const parseDate = (dateValue: Moment | string | undefined): Moment => {
    if (!dateValue) {
      return moment()
    }

    if (typeof dateValue === "string") {
      const parsedDate = moment(dateValue)
      return parsedDate.isValid() ? parsedDate : moment()
    }

    return dateValue
  }

  const [currentDate, setCurrentDate] = useState(parseDate(value))
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const calendarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLButtonElement>(null)
  const daysRef = useRef<(HTMLButtonElement | null)[]>([])
  const yearsRef = useRef<(HTMLButtonElement | null)[]>([])
  
  // 使用refs存储状态，避免不必要的重渲染
  const currentDateRef = useRef<Moment>(currentDate)
  const viewDateRef = useRef<Moment>(moment(currentDate))
  const focusedDayRef = useRef<number | null>(null)
  const viewModeRef = useRef<ViewMode>(viewMode)
  
  // 直接在渲染时更新refs，无需使用useEffect
  currentDateRef.current = currentDate
  viewModeRef.current = viewMode

  // Format date as string
  const formatDate = (date: Moment) => {
    return date.format(format)
  }

  // Check if two dates are the same day
  const isSameDay = (date1: Moment, date2: Moment) => {
    return date1.isSame(date2, "day")
  }

  // Check if a date is disabled
  const isDateDisabled = useCallback(
    (date: Moment) => {
      if (disabledDate) {
        return disabledDate(date)
      }
      return false
    },
    [disabledDate],
  )

  // Handle date selection
  const handleSelectDate = (day: number) => {
    const newDate = moment(viewDateRef.current).date(day)

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
    viewDateRef.current = moment(viewDateRef.current).year(year)
    setViewMode("calendar")
  }

  // Navigate to previous month
  const prevMonth = () => {
    viewDateRef.current = moment(viewDateRef.current).subtract(1, "month")
    focusedDayRef.current = null
    // 强制重新渲染
    setViewMode(prev => prev)
  }

  // Navigate to next month
  const nextMonth = () => {
    viewDateRef.current = moment(viewDateRef.current).add(1, "month")
    focusedDayRef.current = null
    // 强制重新渲染
    setViewMode(prev => prev)
  }

  // Navigate to previous year set
  const prevYearSet = () => {
    viewDateRef.current = moment(viewDateRef.current).subtract(12, "year")
    // 强制重新渲染
    setViewMode(prev => prev)
  }

  // Navigate to next year set
  const nextYearSet = () => {
    viewDateRef.current = moment(viewDateRef.current).add(12, "year")
    // 强制重新渲染
    setViewMode(prev => prev)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return

    if (viewModeRef.current === "year") {
      handleYearKeyDown(e)
      return
    }

    const daysInMonth = viewDateRef.current.daysInMonth()
    const firstDayOfMonth = moment(viewDateRef.current).startOf("month").day()

    // If no day is focused yet, focus on the current day or first day
    if (focusedDayRef.current === null) {
      if (viewDateRef.current.month() === currentDateRef.current.month() && 
          viewDateRef.current.year() === currentDateRef.current.year()) {
        focusedDayRef.current = currentDateRef.current.date()
      } else {
        focusedDayRef.current = 1
      }
      // 强制重新渲染
      setViewMode(prev => prev)
      return
    }
    
    // Handle Tab key navigation
    if (e.key === "Tab") {
      // Allow normal tab navigation but track the focused element after the tab
      setTimeout(() => {
        const focusedElement = document.activeElement
        const focusedIndex = daysRef.current.findIndex(ref => ref === focusedElement)
        
        if (focusedIndex !== -1) {
          const focusedDayNumber = focusedIndex + 1
          focusedDayRef.current = focusedDayNumber
          // 强制重新渲染
          setViewMode(prev => prev)
        }
      }, 0)
      return
    }

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault()
        if (focusedDayRef.current! > 1) {
          focusedDayRef.current = focusedDayRef.current! - 1
          // 强制重新渲染
          setViewMode(prev => prev)
        } else {
          // Go to previous month, last day
          const prevMonthDate = moment(viewDateRef.current).subtract(1, "month")
          const prevMonthDays = prevMonthDate.daysInMonth()
          prevMonth()
          focusedDayRef.current = prevMonthDays
          // 强制重新渲染已在prevMonth中处理
        }
        break
      case "ArrowRight":
        e.preventDefault()
        if (focusedDayRef.current! < daysInMonth) {
          focusedDayRef.current = focusedDayRef.current! + 1
          // 强制重新渲染
          setViewMode(prev => prev)
        } else {
          // Go to next month, first day
          nextMonth()
          focusedDayRef.current = 1
          // 强制重新渲染已在nextMonth中处理
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (focusedDayRef.current! > 7) {
          focusedDayRef.current = focusedDayRef.current! - 7
          // 强制重新渲染
          setViewMode(prev => prev)
        } else {
          // Go to previous month
          const prevMonthDate = moment(viewDateRef.current).subtract(1, "month")
          const prevMonthDays = prevMonthDate.daysInMonth()
          prevMonth()
          const newDay = prevMonthDays - (7 - focusedDayRef.current!)
          focusedDayRef.current = newDay > 0 ? newDay : prevMonthDays
          // 强制重新渲染已在prevMonth中处理
        }
        break
      case "ArrowDown":
        e.preventDefault()
        if (focusedDayRef.current! + 7 <= daysInMonth) {
          focusedDayRef.current = focusedDayRef.current! + 7
          // 强制重新渲染
          setViewMode(prev => prev)
        } else {
          // Go to next month
          const nextMonthDate = moment(viewDateRef.current).add(1, "month")
          const newDay = focusedDayRef.current! + 7 - daysInMonth
          nextMonth()
          focusedDayRef.current = newDay <= nextMonthDate.daysInMonth() ? newDay : 1
          // 强制重新渲染已在nextMonth中处理
        }
        break
      case "Home":
        e.preventDefault()
        // Go to first day of current week
        const currentWeekStart = focusedDayRef.current! - ((focusedDayRef.current! - 1) % 7)
        focusedDayRef.current = currentWeekStart
        // 强制重新渲染
        setViewMode(prev => prev)
        break
      case "End":
        e.preventDefault()
        // Go to last day of current week
        const currentWeekEnd = Math.min(focusedDayRef.current! + (7 - (focusedDayRef.current! % 7)), daysInMonth)
        focusedDayRef.current = currentWeekEnd === 0 ? 7 : currentWeekEnd
        // 强制重新渲染
        setViewMode(prev => prev)
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
        // Make sure we're selecting the currently focused day
        if (focusedDayRef.current !== null) {
          handleSelectDate(focusedDayRef.current)
        }
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
    const startYear = viewDateRef.current.year() - (viewDateRef.current.year() % 12)
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
          const selectedYear = startYear + focusedYearIndex
          handleSelectYear(selectedYear)
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

  // Focus the button for the focused day - 保留这个useEffect因为它处理DOM焦点
  useEffect(() => {
    if (focusedDayRef.current !== null && isOpen && viewMode === "calendar") {
      const index = focusedDayRef.current - 1
      if (daysRef.current[index]) {
        daysRef.current[index]?.focus()
      }
    }
  }, [isOpen, viewMode])

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

  // Reset refs when viewMode changes (作为viewDate变化的替代触发器)
  useEffect(() => {
    daysRef.current = daysRef.current.slice(0, viewDateRef.current.daysInMonth())
    yearsRef.current = new Array(12).fill(null)
  }, [viewMode])

  // Reset view mode when closing
  useEffect(() => {
    if (!isOpen) {
      setViewMode("calendar")
    }
  }, [isOpen])

  // Update current date when value prop changes
  useEffect(() => {
    if (value) {
      const parsedDate = parseDate(value)
      setCurrentDate(parsedDate)
      viewDateRef.current = moment(parsedDate)
    }
  }, [value])

  // Render calendar days
  const renderCalendarDays = () => {
    const daysInMonth = viewDateRef.current.daysInMonth()
    const firstDayOfMonth = moment(viewDateRef.current).startOf("month").day()
    const today = moment()
    const days = []

    // Add days from previous month
    const prevMonthView = moment(viewDateRef.current).subtract(1, "month")
    const prevMonthDays = prevMonthView.daysInMonth()

    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = prevMonthDays - firstDayOfMonth + i + 1
      const date = moment(prevMonthView).date(day)

      days.push(
        <DayButton key={`prev-${day}`} disabled $isAdjacentMonth aria-hidden="true">
          {dateRender ? dateRender(date, today) : day}
        </DayButton>,
      )
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment(viewDateRef.current).date(day)
      const isCurrentDay = isSameDay(date, currentDateRef.current)
      const isToday = isSameDay(date, today)
      const isDisabled = isDateDisabled(date)

      days.push(
        <DayButton
          key={day}
          ref={(el) => (daysRef.current[day - 1] = el)}
          onClick={() => handleSelectDate(day)}
          disabled={isDisabled}
          $isCurrentDay={isCurrentDay}
          $isToday={isToday}
          $isDisabled={isDisabled}
          aria-selected={isCurrentDay}
          aria-current={isToday ? "date" : undefined}
          aria-disabled={isDisabled}
        >
          {dateRender ? dateRender(date, today) : day}
        </DayButton>,
      )
    }

    // Add days from next month
    const totalCells = 42 // 6 rows of 7 days
    const nextMonthDays = totalCells - days.length
    const nextMonthView = moment(viewDateRef.current).add(1, "month")

    for (let day = 1; day <= nextMonthDays; day++) {
      const date = moment(nextMonthView).date(day)

      days.push(
        <DayButton key={`next-${day}`} disabled $isAdjacentMonth aria-hidden="true">
          {dateRender ? dateRender(date, today) : day}
        </DayButton>,
      )
    }

    return days
  }

  // Render year selection
  const renderYearSelection = () => {
    const currentYear = viewDateRef.current.year()
    const startYear = currentYear - (currentYear % 12)
    const years = []
    const today = moment()

    for (let i = 0; i < 12; i++) {
      const year = startYear + i
      const isCurrentYear = year === currentDateRef.current.year()
      const isThisYear = year === today.year()

      years.push(
        <YearButton
          key={year}
          ref={(el) => (yearsRef.current[i] = el)}
          onClick={() => handleSelectYear(year)}
          $isCurrentYear={isCurrentYear}
          $isThisYear={isThisYear}
          aria-selected={isCurrentYear}
        >
          {year}
        </YearButton>,
      )
    }

    return years
  }

  // Render the calendar popup
  const renderCalendarPopup = () => {
    const popup = (
      <CalendarPopup
        ref={calendarRef}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={viewMode === "calendar" ? "Calendar" : "Year selection"}
        tabIndex={-1}
      >
        <CalendarHeader>
          <IconButton
            type="button"
            onClick={viewMode === "calendar" ? prevMonth : prevYearSet}
            aria-label={viewMode === "calendar" ? "Previous month" : "Previous years"}
          >
            <ChevronLeft size={20} />
          </IconButton>
          <MonthYearButton type="button" onClick={() => setViewMode(viewModeRef.current === "calendar" ? "year" : "calendar")}>
            {viewModeRef.current === "calendar"
              ? viewDateRef.current.format("MMMM YYYY")
              : `${viewDateRef.current.year() - (viewDateRef.current.year() % 12)} - ${viewDateRef.current.year() - (viewDateRef.current.year() % 12) + 11}`}
          </MonthYearButton>
          <IconButton
            type="button"
            onClick={viewMode === "calendar" ? nextMonth : nextYearSet}
            aria-label={viewMode === "calendar" ? "Next month" : "Next years"}
          >
            <ChevronRight size={20} />
          </IconButton>
        </CalendarHeader>

        {viewMode === "calendar" ? (
          <>
            <WeekdaysGrid>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <WeekdayLabel key={day}>{day}</WeekdayLabel>
              ))}
            </WeekdaysGrid>

            <DaysGrid>{renderCalendarDays()}</DaysGrid>
          </>
        ) : (
          <YearsGrid>{renderYearSelection()}</YearsGrid>
        )}

        {showToday && (
          <FooterContainer>
            <TodayButton
              type="button"
              onClick={() => {
                const today = moment()
                if (!isDateDisabled(today)) {
                  setCurrentDate(today)
                  setViewDate(moment(today))
                  onChange?.(today)
                  setIsOpen(false)
                }
              }}
            >
              Today
            </TodayButton>
          </FooterContainer>
        )}
      </CalendarPopup>
    )
    return popup
  }

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <DatePickerContainer className={className} width={width} {...restProps}>
        <DatePickerInput
          ref={inputRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          $disabled={disabled}
          aria-haspopup="true"
          aria-expanded={isOpen}
          disabled={disabled}
        >
          {formatDate(currentDate)}
        </DatePickerInput>

        {isOpen && renderCalendarPopup()}
      </DatePickerContainer>
    </StyleSheetManager>
  )
}
