import React from 'react';
import { ProjectCard } from './project-card';
import { projects, ProjectStatus } from '@/app/dashboard/shortcuts/data';

interface ProjectGridProps {
  activeFilter: string;
}

export function ProjectGrid({ activeFilter }: ProjectGridProps) {
  // Filter projects based on active filter
  const filteredProjects = React.useMemo(() => {
    if (activeFilter === '全部') {
      return projects;
    }

    // Map filter names to status values
    const filterStatusMap: Record<string, ProjectStatus[]> = {
      '进行中': [
        ProjectStatus.PENDING,
        ProjectStatus.SELECTING,
        ProjectStatus.SUBMITTED,
        ProjectStatus.RETOUCHING,
        ProjectStatus.PENDING_CONFIRMATION,
      ],
      '选片中': [ProjectStatus.SELECTING],
      '修图中': [ProjectStatus.RETOUCHING],
      '已交付': [ProjectStatus.DELIVERED],
    };

    const statuses = filterStatusMap[activeFilter];
    return projects.filter(project => statuses.includes(project.status));
  }, [activeFilter]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 min-h-[600px]">
      {filteredProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
