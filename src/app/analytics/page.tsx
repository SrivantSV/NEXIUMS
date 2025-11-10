// Analytics Page
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export const metadata = {
  title: 'Analytics & Insights | Nexus AI',
  description: 'Comprehensive analytics, insights, and performance metrics for your AI usage'
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AnalyticsDashboard userId={user.id} />
    </div>
  );
}
