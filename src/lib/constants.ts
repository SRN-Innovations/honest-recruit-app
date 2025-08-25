// Shared constants for dropdown options across the application
// This ensures consistency between candidate profiles and job postings

export const EMPLOYMENT_TYPES = [
  "Permanent",
  "Temporary",
  "Contract",
  "Apprenticeship",
  "Work Experience",
] as const;

export const LOCATION_TYPES = ["Remote", "Office", "Hybrid"] as const;

export const WORKING_HOURS = [
  "Full-time",
  "Part-time",
  "Flexible",
  "Shift work",
  "Weekend",
] as const;

export const SALARY_RANGES = [
  { min: 20000, max: 30000 },
  { min: 30000, max: 40000 },
  { min: 40000, max: 50000 },
  { min: 50000, max: 60000 },
  { min: 60000, max: 70000 },
  { min: 70000, max: 80000 },
  { min: 80000, max: 90000 },
  { min: 90000, max: 100000 },
  { min: 100000, max: 120000 },
  { min: 120000, max: 150000 },
  { min: 150000, max: 200000 },
] as const;

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Japanese",
  "Arabic",
  "Hindi",
  "Portuguese",
  "Russian",
  "Italian",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Polish",
  "Czech",
  "Slovak",
  "Bulgarian",
  "Croatian",
  "Serbian",
  "Ukrainian",
  "Turkish",
  "Greek",
  "Hebrew",
  "Korean",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Malay",
  "Tagalog",
  "Bengali",
  "Urdu",
  "Persian",
  "Swahili",
  "Zulu",
  "Afrikaans",
] as const;

export const START_OPTIONS = [
  "Immediate",
  "2 weeks",
  "1 month",
  "2 months",
  "3 months",
  "Flexible",
] as const;

export const NOTICE_PERIODS = [
  "1 week",
  "2 weeks",
  "1 month",
  "2 months",
  "3 months",
  "Negotiable",
] as const;

export const EQUIPMENT_OPTIONS = [
  "Laptop",
  "Desktop Computer",
  "Phone",
  "Headset",
  "Monitor",
  "Tablet",
  "Printer",
  "Scanner",
  "Software Licenses",
  "Internet Connection",
] as const;

export const GENDER_OPTIONS = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
] as const;

export const NATIONALITIES = [
  "British",
  "Irish",
  "French",
  "German",
  "Italian",
  "Spanish",
  "Portuguese",
  "Dutch",
  "Belgian",
  "Swiss",
  "Austrian",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Polish",
  "Czech",
  "Slovak",
  "Bulgarian",
  "Croatian",
  "Serbian",
  "Ukrainian",
  "Russian",
  "American",
  "Canadian",
  "Australian",
  "New Zealander",
  "Chinese",
  "Japanese",
  "Korean",
  "Indian",
  "Pakistani",
  "Bangladeshi",
  "Other",
] as const;

export const RIGHT_TO_WORK_OPTIONS = [
  {
    value: "citizen",
    label: "British Citizen",
  },
  {
    value: "settled",
    label: "Settled Status / Indefinite Leave to Remain",
  },
  {
    value: "pre-settled",
    label: "Pre-Settled Status",
  },
  {
    value: "work-visa",
    label: "Work Visa",
  },
  {
    value: "student-visa",
    label: "Student Visa with Work Rights",
  },
  {
    value: "dependent-visa",
    label: "Dependent Visa",
  },
  {
    value: "other",
    label: "Other Immigration Status",
  },
  {
    value: "no",
    label: "No Right to Work in UK",
  },
] as const;

export const BENEFITS_OPTIONS = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "401k / Pension",
  "Life Insurance",
  "Paid Time Off",
  "Sick Pay",
  "Maternity/Paternity Leave",
  "Professional Development",
  "Gym Membership",
  "Transport Allowance",
  "Meal Allowance",
  "Childcare Support",
  "Flexible Working",
  "Remote Work Options",
  "Performance Bonuses",
  "Stock Options",
  "Company Car",
  "Mobile Phone",
  "Internet Allowance",
] as const;

// Type helpers
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type LocationType = (typeof LOCATION_TYPES)[number];
export type WorkingHour = (typeof WORKING_HOURS)[number];
export type Language = (typeof LANGUAGES)[number];
export type Gender = (typeof GENDER_OPTIONS)[number];
export type Nationality = (typeof NATIONALITIES)[number];
export type RightToWorkStatus = (typeof RIGHT_TO_WORK_OPTIONS)[number]["value"];
