# Search Candidates Edge Function

This edge function provides backend candidate search functionality for employers, moving the matching logic from the client to the server for better performance and scalability.

## Functionality

### Required Filters (Must Match)

- **Role Types**: Candidates must have matching preferred role types
- **Employment Types**: Candidates must have matching preferred employment types
- **Working Hours**: Candidates must have matching preferred working hours

### Scoring Filters (Contribute to Match Score)

- **Skills Matching** (40 points): Percentage of required skills that match
- **Location Matching** (10 points): Geographic compatibility
- **Salary Matching** (bonus): Overlap in salary expectations

### Privacy Respecting

- Only returns candidates who are `discoverable: true` and `open_for_work: true`
- Contact information is included based on individual privacy settings:
  - Email only if `show_email_in_search: true`
  - Phone only if `show_phone_in_search: true`

## API Usage

### Request

```typescript
POST /functions/v1/search-candidates
Content-Type: application/json

{
  "filters": {
    "roleTypes": ["Software Engineer", "Frontend Developer"],
    "skills": ["React", "TypeScript", "Node.js"],
    "location": "London",
    "employmentTypes": ["Full-time"],
    "workingHours": ["9-5", "Flexible"],
    "salaryMin": 40000,
    "salaryMax": 80000,
    "keywords": "senior developer"
  }
}
```

### Response

```typescript
{
  "results": [
    {
      "candidate": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone_number": "+1234567890",
        // ... other candidate fields
        "show_email_in_search": true,
        "show_phone_in_search": false
      },
      "matchScore": 85,
      "matchReasons": [
        "Role type match",
        "3/3 skills match",
        "Location match",
        "Employment type match",
        "Working hours match",
        "Salary expectations match"
      ],
      "breakdown": {
        "role": { "matched": true, "reason": "Role type matches (required)" },
        "skills": {
          "matched": 3,
          "total": 3,
          "matchedSkills": ["React", "TypeScript", "Node.js"],
          "missingSkills": []
        },
        "location": { "matched": true, "reason": "Location matches" },
        "employment": { "matched": true, "reason": "Employment type matches (required)" },
        "hours": { "matched": true, "reason": "Working hours match (required)" },
        "salary": { "matched": true, "reason": "Salary expectations overlap" }
      }
    }
  ]
}
```

## Benefits

1. **Performance**: Server-side processing reduces client load
2. **Scalability**: Can handle large numbers of candidates efficiently
3. **Privacy**: Respects candidate privacy settings
4. **Accuracy**: Consistent matching logic across all clients
5. **Maintainability**: Centralized search logic

## Deployment

```bash
supabase functions deploy search-candidates
```

## Error Handling

- Returns 400 if filters are missing
- Returns 500 for database or processing errors
- Includes CORS headers for cross-origin requests
