import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { type Project } from '@snapmatch/shared-types';

export function FeaturedProjects() {
  const router = useRouter();
  const [featured, setFeatured] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        const response = await fetch('/admin/api/projects');
        if (!response.ok) {
          throw new Error('获取项目列表失败');
        }

        const result = await response.json();
        // 后端返回 envelope 格式：{ code, message, data, timestamp }
        // 取前 4 个项目作为精选项目（可以改为更复杂的筛选逻辑）
        setFeatured(result.data.slice(0, 4));
      } catch (error) {
        console.error('获取精选项目失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  if (loading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            精选 & 活跃项目
          </h2>
        </div>
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-sm text-muted-foreground">加载中...</div>
        </div>
      </section>
    );
  }

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          精选 & 活跃项目
        </h2>
        <button className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          查看全部 <ArrowRight size={16} />
        </button>
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full group/carousel"
      >
        <CarouselContent>
          {featured.map((project) => (
            <CarouselItem key={project.id} className="md:basis-[450px] lg:basis-[450px]">
              <motion.div
                className="relative group cursor-pointer"
                transition={{ duration: 0.2 }}
                onClick={() => router.push(`dashboard/projects/${project.id}`)}
              >
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
                  <img
                    src={project.coverImageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80'}
                    alt={project.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  <div className="absolute bottom-0 left-0 p-6 z-20 w-full text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm rounded-sm px-2">
                        {project.description || '项目'}
                      </Badge>
                      <span className="text-xs font-medium bg-green-500/80 px-2 py-0.5 rounded-sm backdrop-blur-sm">
                        进行中
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold leading-tight mb-1">{project.name}</h3>
                    <p className="text-white/80 text-sm font-medium">
                      {project.photoCount} 张照片
                    </p>
                  </div>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex invisible opacity-0 group-hover/carousel:visible group-hover/carousel:opacity-100 transition-all duration-300 left-2 top-1/2 -translate-y-1/2 h-16 w-10 bg-background/90 backdrop-blur-sm hover:bg-background text-foreground border border-border shadow-lg rounded-lg" />
        <CarouselNext className="hidden md:flex invisible opacity-0 group-hover/carousel:visible group-hover/carousel:opacity-100 transition-all duration-300 right-2 top-1/2 -translate-y-1/2 h-16 w-10 bg-background/90 backdrop-blur-sm hover:bg-background text-foreground border border-border shadow-lg rounded-lg" />
      </Carousel>
    </section>
  );
}
