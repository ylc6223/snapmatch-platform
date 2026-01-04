"use client";

import React from 'react';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/shortcuts/navbar';
import { FeaturedProjects } from '@/components/shortcuts/featured-projects';
import { FilterBar } from '@/components/shortcuts/filter-bar';
import { ProjectGrid } from '@/components/shortcuts/project-grid';

export default function Page() {
  const [activeFilter, setActiveFilter] = React.useState('全部');

  return (
    <div className="min-h-screen font-sans text-foreground bg-background selection:bg-accent selection:text-accent-foreground">
      <Toaster position="top-right" richColors />
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-6 sm:px-8">
        <FeaturedProjects />

        <div className="mt-2">
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <ProjectGrid activeFilter={activeFilter} />
        </div>
      </main>
    </div>
  );
}
