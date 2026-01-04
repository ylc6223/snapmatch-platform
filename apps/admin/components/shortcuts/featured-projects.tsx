import React from 'react';
import { motion } from 'motion/react';
import { projects } from '@/app/dashboard/shortcuts/data';
import { ArrowRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function FeaturedProjects() {
  const featured = [projects[0], projects[1], projects[4]]; // Selecting specific projects

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          精选 & 活跃项目
        </h2>
        <button className="text-sm font-medium text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
          查看全部 <ArrowRight size={16} />
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 -mx-8 px-8 snap-x scrollbar-hide">
        {featured.map((project) => (
          <motion.div
            key={project.id}
            className="flex-shrink-0 w-[450px] relative group cursor-pointer snap-start"
            transition={{ duration: 0.2 }}
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg shadow-md">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
              <img
                src={project.coverImage}
                alt={project.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              <div className="absolute bottom-0 left-0 p-6 z-20 w-full text-white">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm rounded-sm px-2">
                    {project.type}
                  </Badge>
                  <span className="text-xs font-medium bg-green-500/80 px-2 py-0.5 rounded-sm backdrop-blur-sm">
                    进行中
                  </span>
                </div>
                <h3 className="text-2xl font-bold leading-tight mb-1">{project.title}</h3>
                <p className="text-white/80 text-sm font-medium">{project.client}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add a "See more" card or spacer */}
        <div className="w-8 flex-shrink-0" />
      </div>
    </section>
  );
}
