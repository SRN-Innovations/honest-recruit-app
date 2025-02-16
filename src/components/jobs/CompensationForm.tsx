"use client";

import { useState } from "react";
import { JobPosting } from "@/app/employer/dashboard/jobs/post/page";

interface Props {
  data: JobPosting["compensation"];
  onChange: (data: JobPosting["compensation"]) => void;
  errors?: string[];
}

const defaultBenefits = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "401k",
  "Life Insurance",
  "Paid Time Off",
];

export default function CompensationForm({ data, onChange, errors }: Props) {
  const [newBenefit, setNewBenefit] = useState("");

  const handleAddBenefit = () => {
    if (newBenefit && !data.benefits.includes(newBenefit)) {
      onChange({
        ...data,
        benefits: [...data.benefits, newBenefit],
      });
      setNewBenefit("");
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Paid Holidays *</label>
          <input
            type="number"
            min="0"
            value={data.paidHolidays}
            onChange={(e) =>
              onChange({ ...data, paidHolidays: parseInt(e.target.value) })
            }
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="form-label">Sick Pay</label>
          <select
            value={data.sickPay ? "yes" : "no"}
            onChange={(e) =>
              onChange({ ...data, sickPay: e.target.value === "yes" })
            }
            className="form-select"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="form-label">Bonus Scheme</label>
          <textarea
            value={data.bonusScheme}
            onChange={(e) => onChange({ ...data, bonusScheme: e.target.value })}
            className="form-textarea"
            rows={3}
          />
        </div>

        <div className="col-span-2">
          <label className="form-label">Probation Period</label>
          <input
            type="text"
            value={data.probationPeriod}
            onChange={(e) =>
              onChange({ ...data, probationPeriod: e.target.value })
            }
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="form-label">Benefits</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {data.benefits.map((benefit) => (
            <span
              key={benefit}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm 
                bg-blue-50 dark:bg-blue-900/50 
                text-blue-700 dark:text-blue-200
                border border-blue-200 dark:border-blue-800"
            >
              {benefit}
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    benefits: data.benefits.filter((b) => b !== benefit),
                  })
                }
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            placeholder="Add custom benefit"
            className="form-input"
          />
          <button
            type="button"
            onClick={handleAddBenefit}
            className="btn-secondary whitespace-nowrap"
          >
            Add Benefit
          </button>
        </div>
      </div>
    </div>
  );
}
