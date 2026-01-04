import React from 'react';
import { ProjectCard } from './project-card';
import { projects } from '@/app/dashboard/shortcuts/data';

export function ProjectGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
