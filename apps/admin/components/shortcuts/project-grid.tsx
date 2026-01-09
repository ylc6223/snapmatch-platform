import React from 'react';
import { ProjectCard } from './project-card';
import { ProjectCardSkeleton } from './project-card-skeleton';
import { ProjectStatus, type Project } from '@snapmatch/shared-types';
import { toast } from 'sonner';

interface ProjectGridProps {
  activeFilter: string;
  sortBy?: 'createdAt' | '-createdAt';
}

export function ProjectGrid({ activeFilter, sortBy = '-createdAt' }: ProjectGridProps) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch projects from API
  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/admin/api/projects');
        if (!response.ok) {
          throw new Error('获取项目列表失败');
        }

        const result = await response.json();
        // 后端返回 envelope 格式：{ code, message, data, timestamp }
        // 直接使用后端返回的数据，不做字段映射
        setProjects(result.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : '获取项目列表失败';
        setError(message);
        toast.error(message);
        console.error('获取项目列表失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on active filter
  const filteredProjects = React.useMemo(() => {
    let filtered = projects;

    // 1. 应用筛选
    if (activeFilter !== '全部') {
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
      filtered = filtered.filter(project => statuses.includes(project.status as ProjectStatus));
    }

    // 2. 应用排序
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === '-createdAt' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [activeFilter, projects, sortBy]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 min-h-[600px]">
        {/* 8个骨架屏卡片 */}
        {Array.from({ length: 8 }).map((_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center pb-20 min-h-[600px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center pb-20 min-h-[600px]">
        <p className="text-sm text-muted-foreground">暂无项目</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 min-h-[600px]">
      {filteredProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
