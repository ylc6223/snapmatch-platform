import React from 'react';
import { FileImage } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Project, ProjectStatus } from '@snapmatch/shared-types';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 状态颜色映射（前端特定，不属于共享类型）
const statusColors: Record<ProjectStatus, string> = {
  [ProjectStatus.PENDING]: 'text-amber-500',
  [ProjectStatus.SELECTING]: 'text-blue-500',
  [ProjectStatus.SUBMITTED]: 'text-indigo-500',
  [ProjectStatus.RETOUCHING]: 'text-cyan-500',
  [ProjectStatus.PENDING_CONFIRMATION]: 'text-orange-500',
  [ProjectStatus.DELIVERED]: 'text-green-500',
  [ProjectStatus.CANCELLED]: 'text-gray-400',
};

// 设置 dayjs 中文本地化
dayjs.locale('zh-cn');

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const statusColor = statusColors[project.status as ProjectStatus];

  // 使用 coverImageUrl 或默认封面
  const coverImage = project.coverImageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80';

  // 使用 dayjs 格式化时间
  const formattedDate = dayjs(project.createdAt).format('YYYY年MM月DD日');

  const handleClick = () => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  return (
    <div className="group flex flex-col gap-3 cursor-pointer" onClick={handleClick}>
      {/* Image Area - No hover lift */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted border border-border">
        <img
          src={coverImage}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
      </div>

      {/* Content Area - Minimal */}
      <div className="flex flex-col px-0.5">
        <div className="flex items-start justify-between gap-4">
            <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-foreground transition-colors">
                {project.name}
            </h3>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
           <span className="text-xs font-medium text-muted-foreground">{project.description || '未设置'}</span>
           <span className={`text-[10px] ${statusColor}`}>●</span>
           <span className="text-xs text-muted-foreground font-medium">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
