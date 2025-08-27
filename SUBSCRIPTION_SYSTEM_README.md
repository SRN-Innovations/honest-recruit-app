# Subscription System Documentation

## Overview

This document describes the subscription system implementation for the Honest Recruit platform, which allows employers to subscribe to different job posting plans or purchase one-off job posts.

## Features

- **One-Off Job Post**: £149.99 for a single job posting (valid for 30 days)
- **Starter Plan**: £250/month for up to 3 job postings
- **Growth Plan**: £400/month for up to 10 job postings
- **Unlimited Plan**: £750/month for unlimited job postings

## Architecture

### Database Schema

The system uses two main tables:

1. **`subscriptions`**: Stores user subscription information
2. **`one_off_purchases`**: Stores one-time job post purchases

### Key Components

- **Stripe Integration**: Handles payments and recurring billing
- **Webhook System**: Processes Stripe events and updates database
- **Subscription Middleware**: Enforces job posting limits
- **Pricing Page**: Displays plans and handles subscriptions

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 2. Stripe Dashboard Setup

1. **Create Products**: Create products in your Stripe dashboard for each plan
2. **Create Prices**: Create recurring prices for subscription plans
3. **Set Webhook Endpoint**: Point to `/api/stripe/webhook` in your Stripe dashboard
4. **Configure Webhook Events**: Enable the following events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 3. Database Setup

Run the migration files in order:

```bash
# Run the migrations
supabase db push
```

### 4. Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

## Usage

### For Employers

#### Viewing Plans

- Navigate to `/pricing` to see all available plans
- Compare features and pricing
- Click "Subscribe Now" or "Buy Now" to proceed

#### Managing Subscriptions

- View current subscription status in the employer dashboard
- Monitor job posting usage
- Cancel or reactivate subscriptions
- Upgrade/downgrade plans

#### Job Posting Limits

- System automatically enforces job posting limits
- One-off purchases allow 1 job posting for 30 days
- Subscription plans reset limits monthly

### For Developers

#### Checking Subscription Status

```typescript
import { getUserSubscriptionStatus } from "@/lib/subscription-middleware";

const status = await getUserSubscriptionStatus(userId);
if (status.canPostJob) {
  // Allow job posting
} else {
  // Show upgrade prompt
}
```

#### Enforcing Job Limits

```typescript
import { checkJobPostingPermission } from "@/lib/subscription-middleware";

const permission = await checkJobPostingPermission(userId);
if (!permission.canPost) {
  // Show error message
  console.log(permission.reason);
}
```

#### Updating Job Counts

```typescript
import {
  incrementJobCount,
  decrementJobCount,
} from "@/lib/subscription-middleware";

// When posting a job
await incrementJobCount(userId);

// When deleting a job
await decrementJobCount(userId);
```

## API Endpoints

### Create Checkout Session

- **POST** `/api/stripe/create-checkout-session`
- Creates Stripe checkout session for subscriptions or one-off purchases

### Webhook Handler

- **POST** `/api/stripe/webhook`
- Processes Stripe events and updates database

### Cancel Subscription

- **POST** `/api/stripe/cancel-subscription`
- Cancels subscription at period end

### Reactivate Subscription

- **POST** `/api/stripe/reactivate-subscription`
- Reactivates cancelled subscription

## Database Functions

### `increment_jobs_posted()`

Increments the jobs_posted count for a subscription.

### `decrement_jobs_posted()`

Decrements the jobs_posted count for a subscription.

### `can_post_job(user_uuid)`

Returns boolean indicating if user can post a job.

### `get_subscription_summary(user_uuid)`

Returns subscription summary including usage statistics.

## Security Features

- **Row Level Security (RLS)**: Users can only access their own subscription data
- **Webhook Signature Verification**: Ensures webhook requests are from Stripe
- **Input Validation**: All API endpoints validate input data
- **Error Handling**: Comprehensive error handling and logging

## Monitoring and Maintenance

### Webhook Monitoring

- Monitor webhook delivery in Stripe dashboard
- Check application logs for webhook processing errors
- Verify database consistency after webhook events

### Subscription Status

- Regularly check for expired subscriptions
- Monitor failed payments and update statuses
- Clean up old subscription records

### Performance

- Database indexes on frequently queried fields
- Efficient queries using database functions
- Minimal API calls to Stripe

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**

   - Verify webhook endpoint URL in Stripe dashboard
   - Check webhook secret configuration
   - Ensure endpoint is publicly accessible

2. **Subscription Not Updating**

   - Check webhook event processing logs
   - Verify database connection and permissions
   - Check Stripe API key configuration

3. **Job Limits Not Enforcing**
   - Verify subscription status in database
   - Check job count increment/decrement functions
   - Ensure middleware is properly integrated

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will provide detailed logs for webhook processing and subscription operations.

## Future Enhancements

- **Usage Analytics**: Track job posting patterns and success rates
- **Automated Billing**: Handle failed payments and retry logic
- **Plan Upgrades**: Seamless plan changes with prorated billing
- **Team Management**: Multi-user subscription management
- **API Rate Limiting**: Prevent abuse of job posting system

## Support

For technical support or questions about the subscription system:

1. Check the application logs for error details
2. Verify Stripe dashboard configuration
3. Review database migration status
4. Contact the development team with specific error messages

## License

This subscription system is part of the Honest Recruit platform and is proprietary software.
