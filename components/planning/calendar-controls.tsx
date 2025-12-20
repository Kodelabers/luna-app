"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { CalendarView } from "@/lib/utils/calendar";
import {
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  formatMonthHeader,
} from "@/lib/utils/calendar";
import { addDays } from "@/lib/utils/dates";

interface CalendarControlsProps {
  view: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onRangeChange: (start: Date, end: Date) => void;
}

export function CalendarControls({
  view,
  currentDate,
  onViewChange,
  onDateChange,
  onRangeChange,
}: CalendarControlsProps) {
  const handlePrevious = () => {
    let newDate: Date;
    if (view === "week") {
      newDate = addDays(currentDate, -7);
    } else {
      newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
    }
    onDateChange(newDate);
    updateRange(newDate);
  };

  const handleNext = () => {
    let newDate: Date;
    if (view === "week") {
      newDate = addDays(currentDate, 7);
    } else {
      newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onDateChange(newDate);
    updateRange(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    onDateChange(today);
    updateRange(today);
  };

  const updateRange = (date: Date) => {
    if (view === "week") {
      const start = getStartOfWeek(date);
      const end = getEndOfWeek(date);
      onRangeChange(start, end);
    } else {
      const start = getStartOfMonth(date);
      const end = getEndOfMonth(date);
      onRangeChange(start, end);
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      onDateChange(date);
      updateRange(date);
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          aria-label="Prethodni period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          aria-label="Sljedeći period"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={handleToday}>
          Danas
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="date-picker" className="sr-only">
          Odaberi datum
        </Label>
        <div className="relative">
          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="date-picker"
            type="date"
            value={currentDate.toISOString().split("T")[0]}
            onChange={handleDateInputChange}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            onViewChange("week");
            updateRange(currentDate);
          }}
        >
          Tjedan
        </Button>
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            onViewChange("month");
            updateRange(currentDate);
          }}
        >
          Mjesec
        </Button>
      </div>

      <div className="ml-auto">
        <p className="text-sm font-medium">
          {view === "week"
            ? `Tjedan ${getStartOfWeek(currentDate).toLocaleDateString("hr-HR")} - ${getEndOfWeek(currentDate).toLocaleDateString("hr-HR")}`
            : formatMonthHeader(currentDate)}
        </p>
      </div>
    </div>
  );
}

