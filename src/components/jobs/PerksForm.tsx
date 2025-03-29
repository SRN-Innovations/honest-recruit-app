"use client";

import { useState } from "react";
import { JobPosting } from "@/app/employer/jobs/post/page";

interface Props {
  data: JobPosting["perks"];
  onChange: (data: JobPosting["perks"]) => void;
}

const defaultPerks = {
  wellnessPrograms: [
    "Gym Membership",
    "Mental Health Support",
    "Health Coaching",
  ],
  socialEvents: ["Team Building", "Company Outings", "Holiday Parties"],
  foodAndBeverages: ["Free Snacks", "Catered Lunches", "Coffee & Tea"],
};

export default function PerksForm({ data, onChange }: Props) {
  const [newPerk, setNewPerk] = useState({ category: "", value: "" });

  const handleAddPerk = (category: keyof typeof defaultPerks) => {
    if (newPerk.value && category) {
      onChange({
        ...data,
        [category]: [...data[category], newPerk.value],
      });
      setNewPerk({ category: "", value: "" });
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(defaultPerks).map(([category, options]) => (
        <div key={category}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {category.replace(/([A-Z])/g, " $1").trim()}
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {options.map((perk) => (
              <button
                key={perk}
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    [category]: data[
                      category as keyof typeof defaultPerks
                    ].includes(perk)
                      ? data[category as keyof typeof defaultPerks].filter(
                          (p) => p !== perk
                        )
                      : [...data[category as keyof typeof defaultPerks], perk],
                  })
                }
                className={`px-3 py-1 rounded-full text-sm ${
                  data[category as keyof typeof defaultPerks].includes(perk)
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {perk}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Car
          </label>
          <select
            value={data.companyCar ? "yes" : "no"}
            onChange={(e) =>
              onChange({ ...data, companyCar: e.target.value === "yes" })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Transportation Requirements
          </label>
          <div className="mt-2 space-y-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={data.transportation.drivingLicense}
                onChange={(e) =>
                  onChange({
                    ...data,
                    transportation: {
                      ...data.transportation,
                      drivingLicense: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Driving License Required
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={data.transportation.personalCar}
                onChange={(e) =>
                  onChange({
                    ...data,
                    transportation: {
                      ...data.transportation,
                      personalCar: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Personal Car Required
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
