"use client";

import React from 'react';
import { Navbar } from '@/components/shortcuts/navbar';
import { FeaturedProjects } from '@/components/shortcuts/featured-projects';
import { FilterBar } from '@/components/shortcuts/filter-bar';
import { ProjectGrid } from '@/components/shortcuts/project-grid';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-gray-200">
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-6 sm:px-8">
        <FeaturedProjects />

        <div className="mt-2">
          <FilterBar />
          <ProjectGrid />
        </div>
      </main>
    </div>
  );
}
