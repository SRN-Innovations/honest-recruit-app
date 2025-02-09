"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface Event {
  date: Date;
  type: "interview" | "meeting" | "deadline";
  title: string;
}

export default function CustomCalendar() {
  const [value, setValue] = useState<Value>(new Date());

  // Example events - replace with real data from your backend
  const events: Event[] = [
    {
      date: new Date(2024, 2, 15),
      type: "interview",
      title: "Interview with John Doe",
    },
    {
      date: new Date(2024, 2, 20),
      type: "deadline",
      title: "Application Deadline",
    },
  ];

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const hasEvent = events.some(
        (event) => event.date.toDateString() === date.toDateString()
      );
      return hasEvent ? "has-event" : null;
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dayEvents = events.filter(
        (event) => event.date.toDateString() === date.toDateString()
      );
      return dayEvents.length > 0 ? (
        <div className="event-dots">
          {dayEvents.map((event, index) => (
            <span
              key={index}
              className={`event-dot ${event.type}`}
              title={event.title}
            />
          ))}
        </div>
      ) : null;
    }
  };

  return (
    <div className="calendar-wrapper">
      <Calendar
        onChange={setValue}
        value={value}
        tileClassName={tileClassName}
        tileContent={tileContent}
        className="custom-calendar"
        formatShortWeekday={(locale, date) =>
          date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)
        }
      />
      <style jsx global>{`
        .custom-calendar {
          width: 100%;
          border: none;
          border-radius: 0.5rem;
          padding: 1rem;
          background: transparent;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* Navigation (Month and Arrows) */
        .react-calendar__navigation {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .react-calendar__navigation button {
          min-width: 36px;
          background: none;
          font-size: 1.5rem;
          padding: 0.5rem;
          border: none;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .react-calendar__navigation__label {
          font-weight: 600;
          font-size: 1rem;
          color: #374151;
        }

        .react-calendar__navigation__label__labelText {
          color: #374151;
        }

        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f3f4f6;
          border-radius: 0.375rem;
        }

        .react-calendar__navigation button[disabled] {
          opacity: 0.5;
          background: none;
        }

        /* Weekday headers */
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .react-calendar__month-view__weekdays__weekday {
          padding: 0.75rem;
          color: #4b5563;
        }

        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
          cursor: default;
        }

        /* Calendar grid */
        .react-calendar__month-view__days {
          gap: 4px;
        }

        .react-calendar__tile {
          height: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0.75rem 0.5rem;
          font-size: 0.875rem;
          color: #374151;
          border-radius: 0.375rem;
          position: relative;
          background: none;
        }

        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #f3f4f6;
          color: #111827;
        }

        .react-calendar__tile--now {
          background: #e5f6ff !important;
          color: #00a3ff !important;
          font-weight: 600;
        }

        .react-calendar__tile--active {
          background: #00a3ff !important;
          color: white !important;
          font-weight: 600;
        }

        .react-calendar__month-view__days__day--weekend {
          color: #ef4444;
        }

        .react-calendar__month-view__days__day--neighboringMonth {
          color: #9ca3af !important;
        }

        /* Event indicators */
        .has-event {
          font-weight: 500;
        }

        .event-dots {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 3px;
        }

        .event-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .event-dot.interview {
          background-color: #00a3ff;
        }

        .event-dot.meeting {
          background-color: #4caf50;
        }

        .event-dot.deadline {
          background-color: #f44336;
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .react-calendar__navigation__label,
          .react-calendar__navigation button,
          .react-calendar__tile {
            color: #e5e7eb;
          }

          .react-calendar__navigation__label__labelText {
            color: #e5e7eb;
          }

          .react-calendar__tile:enabled:hover,
          .react-calendar__tile:enabled:focus,
          .react-calendar__navigation button:enabled:hover,
          .react-calendar__navigation button:enabled:focus {
            background-color: #374151;
            color: #f9fafb;
          }

          .react-calendar__tile--now {
            background: rgba(0, 163, 255, 0.1) !important;
          }

          .react-calendar__month-view__days__day--neighboringMonth {
            color: #6b7280 !important;
          }

          .react-calendar__month-view__weekdays__weekday {
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
}
