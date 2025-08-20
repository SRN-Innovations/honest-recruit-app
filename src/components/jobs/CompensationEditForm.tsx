"use client";

import { useState } from "react";

interface Compensation {
  paidHolidays: number;
  sickPay: boolean;
  bonusScheme: string;
  probationPeriod: string;
  benefits: string[];
}

interface Props {
  data: Compensation;
  onSave: (data: Compensation) => void;
  onCancel: () => void;
}

const defaultBenefits = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "401k",
  "Life Insurance",
  "Disability Insurance",
  "Professional Development",
  "Gym Membership",
  "Childcare Support",
  "Transportation Allowance",
];

const probationPeriods = [
  "1 month",
  "2 months",
  "3 months",
  "6 months",
  "1 year",
  "None",
];

export default function CompensationEditForm({
  data,
  onSave,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState<Compensation>(data);
  const [newBenefit, setNewBenefit] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addBenefit = () => {
    if (newBenefit && !formData.benefits.includes(newBenefit)) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit],
      });
      setNewBenefit("");
    }
  };

  const removeBenefit = (benefit: string) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((b) => b !== benefit),
    });
  };

  const toggleDefaultBenefit = (benefit: string) => {
    if (formData.benefits.includes(benefit)) {
      removeBenefit(benefit);
    } else {
      addBenefit();
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefit],
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Paid Holidays <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.paidHolidays}
            onChange={(e) =>
              setFormData({
                ...formData,
                paidHolidays: parseInt(e.target.value),
              })
            }
            className="form-input"
            required
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Number of paid holiday days per year
          </p>
        </div>

        <div>
          <label className="form-label">Probation Period</label>
          <select
            value={formData.probationPeriod}
            onChange={(e) =>
              setFormData({
                ...formData,
                probationPeriod: e.target.value,
              })
            }
            className="form-select"
          >
            <option value="">Select Period</option>
            {probationPeriods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Sick Pay</label>
          <div className="mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.sickPay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sickPay: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Sick pay provided
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="form-label">Bonus Scheme</label>
          <input
            type="text"
            value={formData.bonusScheme}
            onChange={(e) =>
              setFormData({
                ...formData,
                bonusScheme: e.target.value,
              })
            }
            className="form-input"
            placeholder="e.g., Performance-based, Annual, etc."
          />
        </div>
      </div>

      <div>
        <label className="form-label">Benefits Package</label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Select from common benefits or add custom ones
        </p>

        {/* Default Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {defaultBenefits.map((benefit) => (
            <label
              key={benefit}
              className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.benefits.includes(benefit)}
                onChange={() => toggleDefaultBenefit(benefit)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {benefit}
              </span>
            </label>
          ))}
        </div>

        {/* Custom Benefits */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            placeholder="Add custom benefit"
            className="form-input flex-1"
          />
          <button
            type="button"
            onClick={addBenefit}
            disabled={!newBenefit}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {/* Selected Benefits */}
        {formData.benefits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.benefits.map((benefit, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm flex items-center gap-2"
              >
                {benefit}
                <button
                  type="button"
                  onClick={() => removeBenefit(benefit)}
                  className="text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save Changes
        </button>
      </div>
    </form>
  );
}
