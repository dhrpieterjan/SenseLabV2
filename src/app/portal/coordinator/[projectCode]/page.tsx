import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectByCode } from '@/services/projects.service';
import {
  getMonstersByProjectCode,
  getSampleDatesByProjectCode,
} from '@/services/monsters.service';
import { getActiveUsers } from '@/services/users.service';
import { getAnalysesByProject } from '@/actions/analysis.actions';
import { ProjectDetailClient } from '@/components/project-detail-client';
import { createLoader, parseAsString } from 'nuqs/server';
import type { SearchParams } from 'nuqs/server';
import type { PanelMemberInfo } from '@/lib/analysis-types';

// Disable caching for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const monstersTableSearchParams = {
  date: parseAsString.withDefault(''),
};

const loadSearchParams = createLoader(monstersTableSearchParams);

interface ProjectDetailPageProps {
  params: Promise<{
    projectCode: string;
  }>;
  searchParams: Promise<SearchParams>;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { projectCode } = await params;
  const { date } = await loadSearchParams(searchParams);

  // First, get the project to verify it exists
  const projectResult = await getProjectByCode(projectCode);

  if (!projectResult.success || !projectResult.data) {
    notFound();
  }

  const project = projectResult.data;

  // Fetch monsters, dates, panel members, and analyses
  const [monstersResult, datesResult, usersResult, analysesResult] = await Promise.all([
    getMonstersByProjectCode(projectCode),
    getSampleDatesByProjectCode(projectCode),
    getActiveUsers(),
    getAnalysesByProject(projectCode),
  ]);

  const monsters = monstersResult.success ? monstersResult.data || [] : [];
  const availableDates = datesResult.success ? datesResult.data || [] : [];
  const users = usersResult.success ? usersResult.data || [] : [];
  const analyses = analysesResult.success ? analysesResult.data || [] : [];

  // Convert users to PanelMemberInfo format
  const panelMembers: PanelMemberInfo[] = users.map((user) => ({
    ContactGUID: user.ContactGUID,
    ContactFullName: user.ContactFullName,
    ContactMail: user.ContactMail,
  }));

  // Create a map for quick panel member name lookup
  const panelMemberNames = new Map(
    users.map((user) => [user.ContactGUID, user.ContactFullName])
  );

  return (
    <div className="space-y-6">
      <Link
        href="/portal/coordinator"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Projects
      </Link>

      <div className="flex-1">
        <h1 className="text-3xl font-bold">{project.ProjectCode}</h1>
        <p className="text-muted-foreground">{project.ProjectOmschrijving}</p>
        {project.RelatieNaam && (
          <p className="text-sm text-muted-foreground">Client: {project.RelatieNaam}</p>
        )}
      </div>

      <ProjectDetailClient
        projectCode={projectCode}
        projectGUID={project.ProjectGUID}
        monsters={monsters}
        availableDates={availableDates}
        selectedDate={date || undefined}
        panelMembers={panelMembers}
        analyses={analyses}
        panelMemberNames={panelMemberNames}
      />
    </div>
  );
}
