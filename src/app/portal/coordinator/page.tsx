import { CoordinatorPortalClient } from '@/components/coordinator-portal-client';
import { ProjectsTable } from '@/components/projects-table';
import { getAnalyses } from '@/actions/analysis.actions';
import { getActiveUsers } from '@/services/users.service';
import { createLoader, parseAsInteger } from 'nuqs/server';
import type { SearchParams } from 'nuqs/server';

const projectsTableSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

const loadSearchParams = createLoader(projectsTableSearchParams);

interface CoordinatorPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function CoordinatorPage({ searchParams }: CoordinatorPageProps) {
  const { page, pageSize } = await loadSearchParams(searchParams);

  // Fetch all analyses and panel members
  const [analysesResult, usersResult] = await Promise.all([
    getAnalyses(),
    getActiveUsers(),
  ]);

  const analyses = analysesResult.success ? analysesResult.data || [] : [];
  const users = usersResult.success ? usersResult.data || [] : [];

  // Create a map for quick panel member name lookup
  const panelMemberNames = new Map(
    users.map((user) => [user.ContactGUID, user.ContactFullName])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coordinator Portal</h1>
        <p className="text-muted-foreground">
          Manage sensory analysis projects and coordinate testing sessions
        </p>
      </div>

      <CoordinatorPortalClient
        projectsTable={<ProjectsTable page={page} pageSize={pageSize} />}
        analyses={analyses}
        panelMemberNames={panelMemberNames}
      />
    </div>
  );
}
