import React from 'react';
import { FileImage } from 'lucide-react';
import { Project } from '@/app/dashboard/shortcuts/data';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group flex flex-col gap-3 cursor-pointer">
      {/* Image Area - No hover lift */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-gray-100 border border-gray-100">
        <img
          src={project.coverImage}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
      </div>

      {/* Content Area - Minimal */}
      <div className="flex flex-col px-0.5">
        <div className="flex items-start justify-between gap-4">
            <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-black transition-colors">
                {project.title}
            </h3>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
           <span className="text-xs font-medium text-gray-500">{project.type}</span>
           <span className="text-[10px] text-gray-300">●</span>
           <span className="text-xs text-gray-400 font-medium">{project.date}</span>
        </div>
      </div>
    </div>
  );
}
