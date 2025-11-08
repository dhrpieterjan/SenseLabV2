'use client';

import { AllAnalysesList } from '@/components/all-analyses-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Analysis } from '@/lib/analysis-types';
import type { ReactNode } from 'react';

interface CoordinatorPortalClientProps {
  projectsTable: ReactNode;
  analyses: Analysis[];
  panelMemberNames: Map<string, string>;
}

export function CoordinatorPortalClient({
  projectsTable,
  analyses,
  panelMemberNames,
}: CoordinatorPortalClientProps) {
  return (
    <Tabs defaultValue="projects" className="space-y-4">
      <TabsList>
        <TabsTrigger value="projects">Projects</TabsTrigger>
        <TabsTrigger value="analyses">All Analyses ({analyses.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="projects" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Projects with Sensory Analyses</h2>
          <p className="text-sm text-muted-foreground">
            View and manage all projects with sensory analysis capabilities
          </p>
        </div>
        {projectsTable}
      </TabsContent>

      <TabsContent value="analyses" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">All Analyses</h2>
          <p className="text-sm text-muted-foreground">
            View all sensory analyses across all projects
          </p>
        </div>
        <AllAnalysesList analyses={analyses} panelMemberNames={panelMemberNames} />
      </TabsContent>
    </Tabs>
  );
}
