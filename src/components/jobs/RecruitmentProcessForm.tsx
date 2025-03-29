"use client";

import { useState } from "react";
import { JobPosting } from "@/app/employer/jobs/post/page";
import { Calendar } from "@/components/CustomCalendar";

interface Props {
  data: JobPosting["recruitmentProcess"];
  onChange: (data: JobPosting["recruitmentProcess"]) => void;
  errors?: string[];
}

const stageTypes = [
  "Phone Interview",
  "Video Interview",
  "In-Person Interview",
  "Take-Home Test",
  "Live Coding Challenge",
  "Technical Assessment",
];

export default function RecruitmentProcessForm({
  data,
  onChange,
  errors,
}: Props) {
  const [newStage, setNewStage] = useState({
    name: "",
    type: "",
    details: "",
    required: true,
  });

  const handleAddStage = () => {
    if (newStage.name && newStage.type) {
      onChange({
        ...data,
        stages: [...data.stages, newStage],
      });
      setNewStage({ name: "", type: "", details: "", required: true });
    }
  };

  return (
    <div className="space-y-6">
      {errors && errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Stages Section */}
      <div>
        <label className="form-label">Recruitment Stages</label>
        <div className="space-y-4">
          {data.stages.map((stage, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md"
            >
              <span className="flex-1 text-gray-900 dark:text-gray-100">
                {stage.name}
              </span>
              <span className="flex-1 text-gray-600 dark:text-gray-400">
                {stage.type}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    stages: data.stages.filter((_, i) => i !== index),
                  })
                }
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Stage Name"
              value={newStage.name}
              onChange={(e) =>
                setNewStage({ ...newStage, name: e.target.value })
              }
              className="form-input"
            />
            <select
              value={newStage.type}
              onChange={(e) =>
                setNewStage({ ...newStage, type: e.target.value })
              }
              className="form-select"
            >
              <option value="">Select Stage Type</option>
              {stageTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Stage Details"
              value={newStage.details}
              onChange={(e) =>
                setNewStage({ ...newStage, details: e.target.value })
              }
              className="form-textarea col-span-2"
            />
            <button
              type="button"
              onClick={handleAddStage}
              className="btn-primary col-span-2"
            >
              Add Stage
            </button>
          </div>
        </div>
      </div>

      {/* Application Limit */}
      <div>
        <label className="form-label">Application Limit</label>
        <input
          type="number"
          min="0"
          value={data.applicationLimit}
          onChange={(e) =>
            onChange({ ...data, applicationLimit: parseInt(e.target.value) })
          }
          className="form-input"
        />
      </div>

      {/* Expiry Date */}
      <div>
        <label className="form-label">Job Posting Expiry Date</label>
        <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Calendar
            value={data.expiryDate}
            onChange={(date) => onChange({ ...data, expiryDate: date as Date })}
            minDate={new Date()}
          />
        </div>
      </div>
    </div>
  );
}
