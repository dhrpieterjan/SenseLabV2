import { getProjectsWithSensoryAnalysisPaginated } from '@/services/projects.service';
import type { ProjectWithDetails } from '@/services/projects.service';
import { ProjectsPagination } from './projects-pagination';
import Link from 'next/link';

interface ProjectsTableProps {
  page: number;
  pageSize: number;
}

/**
 * Server-side rendered table component that displays paginated projects with sensory analyses.
 * This component fetches data directly from the database on the server.
 */
export async function ProjectsTable({ page, pageSize }: ProjectsTableProps) {
  const response = await getProjectsWithSensoryAnalysisPaginated({ page, pageSize });

  if (!response.success || !response.data) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-destructive">
          {response.error || 'Failed to load projects'}
        </p>
      </div>
    );
  }

  const projects = response.data;
  const pagination = response.pagination;

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          No projects with sensory analyses found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Project Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((project) => (
                <ProjectRow key={project.ProjectGUID} project={project} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && <ProjectsPagination pagination={pagination} />}
    </div>
  );
}

/**
 * Individual project row component
 */
function ProjectRow({ project }: { project: ProjectWithDetails }) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <tr className="hover:bg-muted/50 transition-colors cursor-pointer">
      <td className="px-4 py-3 text-sm font-medium">
        <Link
          href={`/portal/coordinator/${project.ProjectCode}`}
          className="text-primary hover:underline block"
        >
          {project.ProjectCode || '-'}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/portal/coordinator/${project.ProjectCode}`}
          className="block text-foreground"
        >
          {project.ProjectOmschrijving || '-'}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/portal/coordinator/${project.ProjectCode}`}
          className="block text-foreground"
        >
          {project.RelatieNaam || '-'}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/portal/coordinator/${project.ProjectCode}`}
          className="block text-foreground"
        >
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              project.ProjectStatus === 'Actief'
                ? 'bg-green-100 text-green-800'
                : project.ProjectStatus === 'Afgewerkt'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {project.ProjectStatus || 'Unknown'}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/portal/coordinator/${project.ProjectCode}`}
          className="block text-foreground"
        >
          {formatDate(project.ProjectDatumStart)}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/portal/coordinator/${project.ProjectCode}`}
          className="block text-foreground"
        >
          {formatDate(project.ProjectDeadline)}
        </Link>
      </td>
    </tr>
  );
}
