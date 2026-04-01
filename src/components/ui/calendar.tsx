"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
// Use existing button variants if available, or just standard classes
import { buttonVariants } from "@/components/ui/button-variants"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-white",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-slate-500 rounded-md w-8 font-normal text-[0.8rem] uppercase",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-slate-800/50 [&:has([aria-selected].day-outside)]:bg-slate-800/20 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has(>.day-range-start)]:rounded-l-md last:[&:has(>.day-range-end)]:rounded-r-md"
            : "[&:has(>.day-selected)]:rounded-md"
        ),
        day: cn(
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-800 rounded-md transition-colors"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-violet-600 text-white hover:bg-violet-600 hover:text-white focus:bg-violet-600 focus:text-white",
        day_today: "bg-slate-800 text-white font-bold",
        day_outside:
          "day-outside text-slate-600 opacity-50 aria-selected:bg-slate-800/20 aria-selected:text-slate-600 aria-selected:opacity-30",
        day_disabled: "text-slate-700 opacity-50",
        day_range_middle:
          "aria-selected:bg-slate-800 aria-selected:text-slate-300",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeftIcon className="h-4 w-4" />
          if (orientation === "right") return <ChevronRightIcon className="h-4 w-4" />
          return <></>
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
