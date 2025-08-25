#!/bin/bash

# Deploy the match-jobs edge function
echo "Deploying match-jobs edge function..."

# Deploy the function
supabase functions deploy match-jobs

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ match-jobs function deployed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Set your Supabase secrets:"
    echo "   supabase secrets set SUPABASE_URL=your_supabase_url"
    echo "   supabase secrets set SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo ""
    echo "2. Test the function from your candidate jobs page"
    echo ""
    echo "3. Monitor function logs:"
    echo "   supabase functions logs match-jobs --follow"
else
    echo "❌ Failed to deploy match-jobs function"
    exit 1
fi
