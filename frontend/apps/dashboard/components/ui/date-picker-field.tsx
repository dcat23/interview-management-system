"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@feature/ui/components/ui/common/button"
import { Calendar } from "@feature/ui/components/ui/common/calendar"
import { Field, FieldGroup, FieldLabel } from "@feature/ui/components/ui/common/field"
import { Input } from "@feature/ui/components/ui/common/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@feature/ui/components/ui/common/popover"

function toLocalDateString(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toLocalSafeDate(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    12,
    0,
    0,
    0
  )
}

export function DatePickerField({
  date,
  onSelect,
  onSelectDateString,
  placeholder = "Pick a date",
  disabled,
  captionLayout,
  closeOnSelect = false,
  buttonId,
  displayValue,
  className,
}: {
  date?: Date
  onSelect: (date: Date | undefined) => void
  onSelectDateString?: (dateString: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  closeOnSelect?: boolean
  buttonId?: string
  displayValue?: (date: Date) => string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={buttonId}
          variant="outline"
          disabled={disabled}
          data-empty={!date}
          className={
            className ??
            "w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
          }
        >
          {date ? (
            displayValue ? (
              displayValue(date)
            ) : (
              format(date, "PPP")
            )
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout={captionLayout}
          onSelect={(selected) => {
            const normalized = selected ? toLocalSafeDate(selected) : undefined
            onSelect(normalized)
            onSelectDateString?.(
              normalized ? toLocalDateString(normalized) : undefined
            )
            if (closeOnSelect) setOpen(false)
          }}
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  )
}

export function DatePickerRangeField({
  date,
  onSelect,
  label = "Date Picker Range",
  buttonId = "date-picker-range",
}: {
  date?: DateRange
  onSelect: (date: DateRange | undefined) => void
  label?: string
  buttonId?: string
}) {
  return (
    <Field className="mx-auto w-60">
      <FieldLabel htmlFor={buttonId}>{label}</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={buttonId}
            className="justify-start px-2.5 font-normal"
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}

export function DatePickerTimeField({
  date,
  onSelect,
  time,
  onTimeChange,
  defaultTime = "10:30:00",
}: {
  date?: Date
  onSelect: (date: Date | undefined) => void
  time?: string
  onTimeChange?: (time: string) => void
  defaultTime?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <FieldGroup className="mx-auto max-w-xs flex-row">
      <Field>
        <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-optional"
              className="w-32 justify-between font-normal"
            >
              {date ? format(date, "PPP") : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date}
              onSelect={(selected) => {
                onSelect(selected)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-32">
        <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
        <Input
          type="time"
          id="time-picker-optional"
          step="1"
          value={time}
          defaultValue={time === undefined ? defaultTime : undefined}
          onChange={(event) => onTimeChange?.(event.target.value)}
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  )
}

export function DatePickerRangeDemo() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  })

  return <DatePickerRangeField date={date} onSelect={setDate} />
}
