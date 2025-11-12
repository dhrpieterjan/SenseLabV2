import { getCurrentUser } from '@/actions/auth.actions';
import { getAnalysesForTester } from '@/actions/analysis.actions';
import { redirect } from 'next/navigation';
import { TesterAnalysisTable } from '@/components/tester-analysis-table';

export default async function TesterPage() {
  // Get current user
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  // Get all analyses assigned to this tester
  const analysesResult = await getAnalysesForTester(currentUser.ContactGUID);
  const analyses = analysesResult.success ? analysesResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tester Portal</h1>
        <p className="text-muted-foreground">
          Welcome, {currentUser.ContactFullName}. Complete your assigned sensory analysis sessions
          below.
        </p>
      </div>

      <TesterAnalysisTable analyses={analyses} testerId={currentUser.ContactGUID} />
    </div>
  );
}
