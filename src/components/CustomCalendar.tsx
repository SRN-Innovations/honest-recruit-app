"use client";

import dynamic from "next/dynamic";
import { format } from "date-fns";
import type { CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Dynamically import ReactCalendar with no SSR
const ReactCalendar = dynamic(
  () => import("react-calendar").then((mod) => mod.Calendar),
  { ssr: false }
);

export const Calendar = (props: CalendarProps) => {
  return (
    <div className="calendar-container max-w-md mx-auto">
      <ReactCalendar
        {...props}
        className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4"
        tileClassName={({ date }) =>
          `text-gray-900 dark:text-gray-100 ${
            date.getDay() === 0 || date.getDay() === 6
              ? "text-red-500 dark:text-red-400"
              : ""
          }`
        }
        locale="en-GB"
        formatDay={(locale, date) => format(date, "d")}
        formatLongDate={(locale, date) => format(date, "d MMMM yyyy")}
        formatMonth={(locale, date) => format(date, "MMMM yyyy")}
        formatMonthYear={(locale, date) => format(date, "MMMM yyyy")}
        formatShortWeekday={(locale, date) => format(date, "EEE")}
        formatYear={(locale, date) => format(date, "yyyy")}
        nextLabel={
          <span className="text-gray-600 dark:text-gray-300 text-lg">›</span>
        }
        prevLabel={
          <span className="text-gray-600 dark:text-gray-300 text-lg">‹</span>
        }
        next2Label={
          <span className="text-gray-600 dark:text-gray-300 text-lg">»</span>
        }
        prev2Label={
          <span className="text-gray-600 dark:text-gray-300 text-lg">«</span>
        }
      />
      <style jsx global>{`
        .calendar-container .react-calendar {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
        }

        .calendar-container .react-calendar__navigation {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .calendar-container .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          padding: 8px;
          border-radius: 6px;
          color: #1f2937;
        }

        .calendar-container .react-calendar__navigation__label {
          font-weight: 600;
          font-size: 1rem;
          color: #1f2937;
          flex-grow: 1;
          text-align: center;
        }

        .calendar-container .react-calendar__navigation button:enabled:hover,
        .calendar-container .react-calendar__navigation button:enabled:focus {
          background-color: #f3f4f6;
        }

        .calendar-container .react-calendar__navigation button[disabled] {
          background-color: transparent;
          opacity: 0.5;
        }

        .calendar-container .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75em;
          color: #6b7280;
        }

        .calendar-container .react-calendar__month-view__weekdays__weekday {
          padding: 0.5em;
        }

        .calendar-container
          .react-calendar__month-view__weekdays__weekday
          abbr {
          text-decoration: none;
        }

        .calendar-container .react-calendar__month-view__days__day {
          padding: 0.5em;
        }

        .calendar-container .react-calendar__tile {
          max-width: 100%;
          padding: 10px 6.6667px;
          background: none;
          text-align: center;
          line-height: 16px;
          font-size: 14px;
          border-radius: 6px;
        }

        .calendar-container .react-calendar__tile:enabled:hover,
        .calendar-container .react-calendar__tile:enabled:focus {
          background-color: #f3f4f6;
          color: #1f2937 !important;
        }

        .calendar-container .react-calendar__tile--now {
          background: #e5f6ff;
          color: #00a3ff;
          font-weight: 600;
        }

        .calendar-container .react-calendar__tile--active {
          background: #00a3ff;
          color: white !important;
          font-weight: 600;
        }

        .calendar-container .react-calendar__tile--active:enabled:hover,
        .calendar-container .react-calendar__tile--active:enabled:focus {
          background: #0096eb;
          color: white !important;
        }

        @media (prefers-color-scheme: dark) {
          .calendar-container .react-calendar__navigation button {
            color: #e5e7eb;
          }

          .calendar-container .react-calendar__navigation__label {
            color: #e5e7eb;
          }

          .calendar-container .react-calendar__navigation button:enabled:hover,
          .calendar-container .react-calendar__navigation button:enabled:focus {
            background-color: #374151;
          }

          .calendar-container .react-calendar__month-view__weekdays {
            color: #9ca3af;
          }

          .calendar-container .react-calendar__tile:enabled:hover,
          .calendar-container .react-calendar__tile:enabled:focus {
            background-color: #374151;
            color: #e5e7eb !important;
          }

          .calendar-container .react-calendar__tile--now {
            background: rgba(0, 163, 255, 0.1);
          }

          .calendar-container .react-calendar__tile--active {
            background: #00a3ff;
          }

          .calendar-container .react-calendar__tile--active:enabled:hover,
          .calendar-container .react-calendar__tile--active:enabled:focus {
            background: #0096eb;
          }
        }
      `}</style>
    </div>
  );
};
