# Match Jobs Edge Function

This Supabase Edge Function matches candidates with job postings based on their profile preferences and job requirements.

## Features

- **Role Type Matching**: Matches candidate's preferred role types with job requirements (25% weight)
- **Employment Type Matching**: Matches employment type preferences (15% weight)
- **Location Matching**: Matches location type preferences (15% weight)
- **Working Hours Matching**: Matches working hours preferences (10% weight)
- **Skills Matching**: Analyzes required and optional skills (20% weight)
- **Salary Matching**: Compares salary expectations with job offers (10% weight)
- **Language Matching**: Matches language requirements (5% weight)

## Deployment

1. **Deploy the function:**

   ```bash
   supabase functions deploy match-jobs
   ```

2. **Set environment variables:**
   ```bash
   supabase secrets set SUPABASE_URL=your_supabase_url
   supabase secrets set SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Usage

The function is called from the candidate jobs page and requires:

- `candidateId`: The ID of the candidate to match jobs for
- Authentication header with valid Supabase token

## Response Format

```json
{
  "matches": [
    {
      "job": {
        "id": "job_id",
        "title": "Job Title",
        "company_name": "Company Name",
        "location": "Remote",
        "employment_type": "Full-time",
        "working_hours": "9-5",
        "salary_min": 30000,
        "salary_max": 40000,
        "skills": ["JavaScript", "React"],
        "optional_skills": ["TypeScript"],
        "languages": [
          { "language": "English", "speak": true, "read": true, "write": true }
        ],
        "role_type": "Frontend Developer",
        "created_at": "2024-01-01T00:00:00Z"
      },
      "score": 85,
      "matchReasons": [
        "Role type matches your preference: Frontend Developer",
        "Employment type matches your preference: Full-time",
        "You have 2 out of 3 required skills"
      ],
      "skillMatch": 67,
      "salaryMatch": 100,
      "preferenceMatch": 100
    }
  ],
  "totalJobs": 50,
  "matchedJobs": 25
}
```

## Algorithm Details

The matching algorithm uses weighted scoring:

1. **Role Type**: 25% - Exact match with candidate preferences
2. **Employment Type**: 15% - Match with preferred work arrangements
3. **Location**: 15% - Match with preferred work locations
4. **Working Hours**: 10% - Match with preferred schedules
5. **Skills**: 20% - Percentage of required skills the candidate has
6. **Salary**: 10% - Match with salary expectations (within 10% for exact, within range for range)
7. **Languages**: 5% - Match with language requirements

Only jobs with a score > 0 are returned, sorted by highest match score first.
