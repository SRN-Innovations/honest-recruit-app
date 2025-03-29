"use client";

import { useState } from "react";
import { JobPosting } from "@/app/employer/jobs/post/page";
import { Calendar } from "@/components/CustomCalendar";

interface Props {
  data: JobPosting["legal"];
  activeUntil: JobPosting["activeUntil"];
  attachments: JobPosting["attachments"];
  onChange: (
    legal: JobPosting["legal"],
    activeUntil: JobPosting["activeUntil"],
    attachments: JobPosting["attachments"]
  ) => void;
}

const referenceTypes = [
  "Former Manager",
  "Current Manager",
  "Colleague",
  "Client",
  "Academic",
];

export default function LegalForm({
  data,
  activeUntil,
  attachments,
  onChange,
}: Props) {
  const [newReferenceType, setNewReferenceType] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onChange(data, activeUntil, Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Right to Work Check Required
          </label>
          <select
            value={data.rightToWork ? "yes" : "no"}
            onChange={(e) =>
              onChange(
                { ...data, rightToWork: e.target.value === "yes" },
                activeUntil,
                attachments
              )
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Background Check Required
          </label>
          <select
            value={data.backgroundCheck ? "yes" : "no"}
            onChange={(e) =>
              onChange(
                { ...data, backgroundCheck: e.target.value === "yes" },
                activeUntil,
                attachments
              )
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of References Required
          </label>
          <input
            type="number"
            min="0"
            value={data.references.count}
            onChange={(e) =>
              onChange(
                {
                  ...data,
                  references: {
                    ...data.references,
                    count: parseInt(e.target.value),
                  },
                },
                activeUntil,
                attachments
              )
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Role Active Until
        </label>
        <div className="mt-2 space-y-2">
          <label className="inline-flex items-center">
            <input
              type="radio"
              checked={activeUntil.type === "untilFilled"}
              onChange={() =>
                onChange(data, { type: "untilFilled" }, attachments)
              }
              className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Until Filled
            </span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              checked={activeUntil.type === "date"}
              onChange={() =>
                onChange(
                  data,
                  { type: "date", date: activeUntil.date || new Date() },
                  attachments
                )
              }
              className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Specific Date
            </span>
          </label>
        </div>
        {activeUntil.type === "date" && (
          <div className="mt-2">
            <Calendar
              value={activeUntil.date}
              onChange={(date) =>
                onChange(
                  data,
                  { type: "date", date: date as Date },
                  attachments
                )
              }
              minDate={new Date()}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Attachments
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
    </div>
  );
}
