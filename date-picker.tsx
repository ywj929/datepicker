"use client"

import type React from "react"
import { useState, useEffect, useRef, type KeyboardEvent, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createPortal } from "react-dom"
import styled from "styled-components"
import moment from "moment"
import type { Moment } from "moment"

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
  getCalendarContainer?: () => HTMLElement
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
  getCalendarContainer,
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
  const [viewDate, setViewDate] = useState(moment(currentDate))
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
    const newDate = moment(viewDate).date(day)

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
    setViewDate(moment(viewDate).year(year))
    setViewMode("calendar")
  }

  // Navigate to previous month
  const prevMonth = () => {
    setViewDate(moment(viewDate).subtract(1, "month"))
    setFocusedDay(null)
  }

  // Navigate to next month
  const nextMonth = () => {
    setViewDate(moment(viewDate).add(1, "month"))
    setFocusedDay(null)
  }

  // Navigate to previous year set
  const prevYearSet = () => {
    setViewDate(moment(viewDate).subtract(12, "year"))
  }

  // Navigate to next year set
  const nextYearSet = () => {
    setViewDate(moment(viewDate).add(12, "year"))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return

    if (viewMode === "year") {
      handleYearKeyDown(e)
      return
    }

    const daysInMonth = viewDate.daysInMonth()
    const firstDayOfMonth = moment(viewDate).startOf("month").day()

    // If no day is focused yet, focus on the current day or first day
    if (focusedDay === null) {
      if (viewDate.month() === currentDate.month() && viewDate.year() === currentDate.year()) {
        setFocusedDay(currentDate.date())
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
          const prevMonthDate = moment(viewDate).subtract(1, "month")
          const prevMonthDays = prevMonthDate.daysInMonth()
          prevMonth()
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
          const prevMonthDate = moment(viewDate).subtract(1, "month")
          const prevMonthDays = prevMonthDate.daysInMonth()
          prevMonth()
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
          const nextMonthDate = moment(viewDate).add(1, "month")
          const newDay = focusedDay + 7 - daysInMonth
          nextMonth()
          setFocusedDay(newDay <= nextMonthDate.daysInMonth() ? newDay : 1)
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
    const startYear = viewDate.year() - (viewDate.year() % 12)
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
    daysRef.current = daysRef.current.slice(0, viewDate.daysInMonth())
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
      const parsedDate = parseDate(value)
      setCurrentDate(parsedDate)
      setViewDate(moment(parsedDate))
    }
  }, [value])

  // Render calendar days
  const renderCalendarDays = () => {
    const daysInMonth = viewDate.daysInMonth()
    const firstDayOfMonth = moment(viewDate).startOf("month").day()
    const today = moment()
    const days = []

    // Add days from previous month
    const prevMonth = moment(viewDate).subtract(1, "month")
    const prevMonthDays = prevMonth.daysInMonth()

    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = prevMonthDays - firstDayOfMonth + i + 1
      const date = moment(prevMonth).date(day)

      days.push(
        <DayButton key={`prev-${day}`} disabled $isAdjacentMonth aria-hidden="true">
          {dateRender ? dateRender(date, today) : day}
        </DayButton>,
      )
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment(viewDate).date(day)
      const isCurrentDay = isSameDay(date, currentDate)
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
    const nextMonth = moment(viewDate).add(1, "month")

    for (let day = 1; day <= nextMonthDays; day++) {
      const date = moment(nextMonth).date(day)

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
    const currentYear = viewDate.year()
    const startYear = currentYear - (currentYear % 12)
    const years = []
    const today = moment()

    for (let i = 0; i < 12; i++) {
      const year = startYear + i
      const isCurrentYear = year === currentDate.year()
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
          <MonthYearButton type="button" onClick={() => setViewMode(viewMode === "calendar" ? "year" : "calendar")}>
            {viewMode === "calendar"
              ? viewDate.format("MMMM YYYY")
              : `${viewDate.year() - (viewDate.year() % 12)} - ${viewDate.year() - (viewDate.year() % 12) + 11}`}
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

    // Render in a portal if getCalendarContainer is provided
    if (popupContainer) {
      return createPortal(popup, popupContainer)
    }

    return popup
  }

  return (
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
  )
}
