# Candidate Profile System

## Overview

The candidate profile system allows candidates to create comprehensive profiles that align with job posting requirements, enabling better job matching and application processes.

## Features

### 1. Basic Information

- **Personal Details**: Full name, email, phone, address, date of birth, gender, nationality
- **Right to Work**: Status, visa type, and expiry date (if applicable)

### 2. Professional Summary

- **Professional Summary**: A brief overview of background, skills, and career objectives

### 3. Job Preferences

- **Preferred Role Types**: Based on available role types in the system
- **Employment Types**: Permanent, Temporary, Contract, Apprenticeship, Work Experience
- **Location Types**: Remote, Office, Hybrid
- **Working Hours**: Full-time, Part-time, Flexible, Shift work, Weekend

### 4. Salary Expectations

- **Exact Amount**: Specific salary requirement
- **Salary Range**: Predefined ranges from £20k to £200k+

### 5. Skills Management

- **Add Custom Skills**: Candidates can add skills not predefined in the system
- **Skill Categories**: Skills are organized by role types for better matching

### 6. Language Proficiency

- **Multiple Languages**: Support for various languages
- **Proficiency Levels**: Speak, Read, Write capabilities for each language

### 7. Professional Experience

- **Work History**: Company, position, dates, current status
- **Role Descriptions**: Detailed responsibilities and achievements
- **Skills Used**: Skills utilized in each role

### 8. Education

- **Academic Background**: Institution, degree, field of study, dates
- **Current Status**: Whether currently studying
- **Additional Details**: Optional descriptions

### 9. Certifications

- **Professional Certifications**: Name, issuing organization, dates
- **Credential Management**: ID and URL for verification
- **Expiry Tracking**: Optional expiry dates for time-sensitive certifications

## Database Structure

### Table: `candidate_profiles`

```sql
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    address TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    nationality TEXT NOT NULL,
    right_to_work JSONB NOT NULL,
    professional_summary TEXT,
    preferred_role_types JSONB DEFAULT '[]',
    preferred_employment_types JSONB DEFAULT '[]',
    preferred_location_types JSONB DEFAULT '[]',
    preferred_working_hours JSONB DEFAULT '[]',
    salary_expectations JSONB DEFAULT '{}',
    skills JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Job Matching Alignment

The candidate profile system is designed to align with job posting requirements:

### 1. Role Type Matching

- Candidates select preferred role types that correspond to job posting role types
- Skills are automatically filtered based on selected role types

### 2. Employment Preferences

- Employment type preferences match job posting employment types
- Location preferences align with job posting location requirements
- Working hours preferences correspond to job posting working hours

### 3. Skills Alignment

- Required skills from job postings can be matched against candidate skills
- Optional skills provide additional matching criteria
- Custom skills allow for flexible skill representation

### 4. Compensation Matching

- Salary expectations can be compared with job posting salary ranges
- Both exact amounts and ranges are supported

### 5. Experience Requirements

- Work experience details provide context for job requirements
- Skills used in previous roles help validate skill claims
- Education and certifications support qualification requirements

## Security Features

### Row Level Security (RLS)

- Candidates can only view and edit their own profiles
- Employers can view candidate profiles for job matching purposes
- All operations require proper authentication

### Data Validation

- Input validation for all form fields
- JSON schema validation for complex data structures
- Referential integrity with user authentication

## Performance Optimizations

### Database Indexes

- GIN indexes on JSONB fields for efficient querying
- Composite indexes for common search patterns
- Automatic timestamp updates for data freshness

### Query Optimization

- Efficient JSONB queries for complex data structures
- Pagination support for large datasets
- Caching strategies for frequently accessed data

## Usage Instructions

### For Candidates

1. **Access Profile**: Navigate to `/candidate/profile`
2. **Edit Information**: Update basic information and preferences
3. **Add Experience**: Include work history, education, and certifications
4. **Manage Skills**: Add and organize relevant skills
5. **Set Preferences**: Configure job preferences and salary expectations
6. **Save Changes**: All changes are automatically saved to the database

### For Employers

1. **View Profiles**: Access candidate profiles for job matching
2. **Search Candidates**: Use profile data for candidate search
3. **Match Requirements**: Compare job requirements with candidate profiles
4. **Contact Candidates**: Use profile information for recruitment outreach

## Future Enhancements

### Planned Features

- **Advanced Search**: Complex filtering and search capabilities
- **Profile Scoring**: Automated matching scores based on job requirements
- **Recommendation Engine**: AI-powered job and candidate recommendations
- **Profile Analytics**: Insights into profile completeness and effectiveness
- **Integration APIs**: External system integrations for enhanced functionality

### Technical Improvements

- **Real-time Updates**: WebSocket support for live profile updates
- **Advanced Caching**: Redis integration for improved performance
- **Search Optimization**: Elasticsearch integration for better search capabilities
- **Mobile Support**: Responsive design and mobile app integration

## Troubleshooting

### Common Issues

1. **Profile Not Loading**: Check authentication and user permissions
2. **Save Failures**: Verify database connectivity and RLS policies
3. **Skill Loading**: Ensure role types are properly configured
4. **Data Validation**: Check input format and required fields

### Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
