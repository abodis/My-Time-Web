import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className = "", ...props }: CalendarProps) {
  return (
    <DayPicker
      className={`p-3 ${className}`}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
