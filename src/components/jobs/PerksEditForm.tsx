"use client";

import { useState } from "react";

interface Perks {
  wellnessPrograms: string[];
  socialEvents: string[];
  foodAndBeverages: string[];
  companyCar: boolean;
  transportation: {
    drivingLicense: boolean;
    personalCar: boolean;
  };
}

interface Props {
  data: Perks;
  onSave: (data: Perks) => void;
  onCancel: () => void;
}

const defaultWellnessPrograms = [
  "Gym Membership",
  "Yoga Classes",
  "Meditation Sessions",
  "Mental Health Support",
  "Health Screenings",
  "Fitness Challenges",
  "Wellness Workshops",
  "Stress Management",
];

const defaultSocialEvents = [
  "Team Building",
  "Company Parties",
  "Holiday Celebrations",
  "Sports Teams",
  "Book Clubs",
  "Game Nights",
  "Volunteer Days",
  "Lunch & Learns",
];

const defaultFoodAndBeverages = [
  "Free Coffee",
  "Free Tea",
  "Snacks",
  "Lunch Provided",
  "Breakfast",
  "Fruit Basket",
  "Drinks",
  "Catered Events",
];

export default function PerksEditForm({ data, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<Perks>(data);
  const [newWellness, setNewWellness] = useState("");
  const [newSocial, setNewSocial] = useState("");
  const [newFood, setNewFood] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addWellness = () => {
    if (newWellness && !formData.wellnessPrograms.includes(newWellness)) {
      setFormData({
        ...formData,
        wellnessPrograms: [...formData.wellnessPrograms, newWellness],
      });
      setNewWellness("");
    }
  };

  const removeWellness = (program: string) => {
    setFormData({
      ...formData,
      wellnessPrograms: formData.wellnessPrograms.filter((p) => p !== program),
    });
  };

  const addSocial = () => {
    if (newSocial && !formData.socialEvents.includes(newSocial)) {
      setFormData({
        ...formData,
        socialEvents: [...formData.socialEvents, newSocial],
      });
      setNewSocial("");
    }
  };

  const removeSocial = (event: string) => {
    setFormData({
      ...formData,
      socialEvents: formData.socialEvents.filter((e) => e !== event),
    });
  };

  const addFood = () => {
    if (newFood && !formData.foodAndBeverages.includes(newFood)) {
      setFormData({
        ...formData,
        foodAndBeverages: [...formData.foodAndBeverages, newFood],
      });
      setNewFood("");
    }
  };

  const removeFood = (item: string) => {
    setFormData({
      ...formData,
      foodAndBeverages: formData.foodAndBeverages.filter((f) => f !== item),
    });
  };

  const toggleDefaultWellness = (program: string) => {
    if (formData.wellnessPrograms.includes(program)) {
      removeWellness(program);
    } else {
      setFormData({
        ...formData,
        wellnessPrograms: [...formData.wellnessPrograms, program],
      });
    }
  };

  const toggleDefaultSocial = (event: string) => {
    if (formData.socialEvents.includes(event)) {
      removeSocial(event);
    } else {
      setFormData({
        ...formData,
        socialEvents: [...formData.socialEvents, event],
      });
    }
  };

  const toggleDefaultFood = (item: string) => {
    if (formData.foodAndBeverages.includes(item)) {
      removeFood(item);
    } else {
      setFormData({
        ...formData,
        foodAndBeverages: [...formData.foodAndBeverages, item],
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Car */}
      <div>
        <label className="form-label">Company Car</label>
        <div className="mt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.companyCar}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  companyCar: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Company car provided
            </span>
          </label>
        </div>
      </div>

      {/* Transportation Requirements */}
      <div>
        <label className="form-label">Transportation Requirements</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.transportation.drivingLicense}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transportation: {
                    ...formData.transportation,
                    drivingLicense: e.target.checked,
                  },
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Driving license required
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.transportation.personalCar}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transportation: {
                    ...formData.transportation,
                    personalCar: e.target.checked,
                  },
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Personal car required
            </span>
          </label>
        </div>
      </div>

      {/* Wellness Programs */}
      <div>
        <label className="form-label">Wellness Programs</label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Select from common wellness programs or add custom ones
        </p>

        {/* Default Wellness Programs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {defaultWellnessPrograms.map((program) => (
            <label
              key={program}
              className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.wellnessPrograms.includes(program)}
                onChange={() => toggleDefaultWellness(program)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {program}
              </span>
            </label>
          ))}
        </div>

        {/* Custom Wellness Programs */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newWellness}
            onChange={(e) => setNewWellness(e.target.value)}
            placeholder="Add custom wellness program"
            className="form-input flex-1"
          />
          <button
            type="button"
            onClick={addWellness}
            disabled={!newWellness}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {/* Selected Wellness Programs */}
        {formData.wellnessPrograms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.wellnessPrograms.map((program, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm flex items-center gap-2"
              >
                {program}
                <button
                  type="button"
                  onClick={() => removeWellness(program)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Social Events */}
      <div>
        <label className="form-label">Social Events</label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Select from common social events or add custom ones
        </p>

        {/* Default Social Events */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {defaultSocialEvents.map((event) => (
            <label
              key={event}
              className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.socialEvents.includes(event)}
                onChange={() => toggleDefaultSocial(event)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {event}
              </span>
            </label>
          ))}
        </div>

        {/* Custom Social Events */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newSocial}
            onChange={(e) => setNewSocial(e.target.value)}
            placeholder="Add custom social event"
            className="form-input flex-1"
          />
          <button
            type="button"
            onClick={addSocial}
            disabled={!newSocial}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {/* Selected Social Events */}
        {formData.socialEvents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.socialEvents.map((event, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm flex items-center gap-2"
              >
                {event}
                <button
                  type="button"
                  onClick={() => removeSocial(event)}
                  className="text-orange-600 hover:text-orange-800"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Food & Beverages */}
      <div>
        <label className="form-label">Food & Beverages</label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Select from common food & beverage options or add custom ones
        </p>

        {/* Default Food & Beverages */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {defaultFoodAndBeverages.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.foodAndBeverages.includes(item)}
                onChange={() => toggleDefaultFood(item)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item}
              </span>
            </label>
          ))}
        </div>

        {/* Custom Food & Beverages */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newFood}
            onChange={(e) => setNewFood(e.target.value)}
            placeholder="Add custom food or beverage"
            className="form-input flex-1"
          />
          <button
            type="button"
            onClick={addFood}
            disabled={!newFood}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {/* Selected Food & Beverages */}
        {formData.foodAndBeverages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.foodAndBeverages.map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm flex items-center gap-2"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeFood(item)}
                  className="text-yellow-600 hover:text-yellow-800"
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
