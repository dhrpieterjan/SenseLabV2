import { getCurrentUser } from '@/actions/auth.actions';
import { getAnalysisById } from '@/actions/analysis.actions';
import { redirect } from 'next/navigation';
import { TestingInterfaceWrapper } from '@/components/testing-interface-wrapper';

interface TesterAnalysisPageProps {
  params: Promise<{
    analysisId: string;
  }>;
}

export default async function TesterAnalysisPage({ params }: TesterAnalysisPageProps) {
  const { analysisId } = await params;

  // Get current user
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  // Get the analysis
  const analysisResult = await getAnalysisById(analysisId);

  if (!analysisResult.success || !analysisResult.data) {
    redirect('/portal/tester');
  }

  const analysis = analysisResult.data;

  // Verify tester is assigned to this analysis
  if (!analysis.panelMemberIds.includes(currentUser.ContactGUID)) {
    redirect('/portal/tester');
  }

  // Check if analysis is active
  if (!analysis.isActive) {
    redirect('/portal/tester');
  }

  // Check if 12 hours have passed
  if (analysis.activatedAt) {
    const hoursElapsed =
      (new Date().getTime() - new Date(analysis.activatedAt).getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 12) {
      redirect('/portal/tester');
    }
  }

  return (
    <TestingInterfaceWrapper
      analysisId={analysisId}
      testerId={currentUser.ContactGUID}
      initialAnalysis={analysis}
    />
  );
}
