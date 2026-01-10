"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProjectDetailDrawer } from '@/components/projects/project-detail-drawer';
import { type Project } from '@snapmatch/shared-types';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/admin/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error('获取项目详情失败');
        }

        const result = await response.json();
        setProject(result.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : '获取项目详情失败';
        setError(message);
        toast.error(message);
        console.error('获取项目详情失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-3xl">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">加载项目详情中...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-3xl">
        <div className="text-center max-w-md px-6">
          <p className="text-lg font-semibold text-foreground mb-2">加载失败</p>
          <p className="text-sm text-muted-foreground mb-6">{error || '项目不存在'}</p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProjectDetailDrawer
        isOpen={true}
        onClose={handleClose}
        project={project}
      />
    </>
  );
}
