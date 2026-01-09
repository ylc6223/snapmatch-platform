"use client";

import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, FileText, User, Package, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Package {
  id: string;
  name: string;
  description?: string;
  includedRetouchCount: number;
  includedAlbumCount: number;
  price?: number;
}

interface ProjectCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

/**
 * ProjectCreateDrawer - 项目创建抽屉
 * 设计理念：快速创建，绑定客户和套餐
 * 左侧：封面上传预览
 * 右侧：项目信息表单（名称+客户+套餐）
 */
export const ProjectCreateDrawer: React.FC<ProjectCreateDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [projectName, setProjectName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isPackageOpen, setIsPackageOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customerContainerRef = useRef<HTMLDivElement>(null);
  const packageContainerRef = useRef<HTMLDivElement>(null);

  // 默认封面图
  const defaultCover = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80';
  const currentCover = coverImageUrl || defaultCover;

  // TODO: 从API获取客户列表
  const [customers] = useState<Customer[]>([
    { id: '1', name: '张三', phone: '13800138000' },
    { id: '2', name: '李四', phone: '13900139000' },
    { id: '3', name: '王五', phone: '13700137000' },
  ]);

  // TODO: 从API获取套餐列表
  const [packages] = useState<Package[]>([
    { id: '1', name: '基础套餐', includedRetouchCount: 10, includedAlbumCount: 20, price: 298000 },
    { id: '2', name: '标准套餐', includedRetouchCount: 20, includedAlbumCount: 40, price: 498000 },
    { id: '3', name: '豪华套餐', includedRetouchCount: 30, includedAlbumCount: 60, price: 798000 },
  ]);

  // 点击外部关闭下拉
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(event.target as Node)) {
        setIsCustomerOpen(false);
      }
      if (packageContainerRef.current && !packageContainerRef.current.contains(event.target as Node)) {
        setIsPackageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!projectName.trim()) {
      toast.error('请输入项目名称');
      return;
    }
    if (!selectedCustomer) {
      toast.error('请选择客户');
      return;
    }
    if (!selectedPackage) {
      toast.error('请选择套餐');
      return;
    }

    setIsSubmitting(true);

    try {
      // 调用创建 API
      const response = await fetch('/admin/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName.trim(),
          coverImageUrl: coverImageUrl,
          customerId: selectedCustomer,
          packageId: selectedPackage,
          // 其他字段使用默认值
          description: '',
          shootDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('创建项目失败');
      }

      const result = await response.json();

      toast.success('项目创建成功！', {
        description: '即将跳转到项目详情页',
      });

      // 清空表单
      setProjectName('');
      setCoverImageUrl('');
      setSelectedCustomer('');
      setSelectedPackage('');

      // 关闭抽屉并跳转
      onClose();
      onSuccess(result.data.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建项目失败';
      toast.error(message);
      console.error('创建项目失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: 实现真实的文件上传逻辑
    // 这里暂时使用占位符
    const mockUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000)}/800/450`;
    setCoverImageUrl(mockUrl);
    toast.success('封面上传成功');
  };

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const selectedPackageData = packages.find(p => p.id === selectedPackage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-background/95 backdrop-blur-3xl transition-all duration-300 animate-in fade-in zoom-in-95">

      {/* 左侧区域：封面上传预览 */}
      <div className="relative w-full md:flex-1 h-[40vh] md:h-full flex flex-col bg-muted/20 select-none border-b md:border-b-0 md:border-r border-border/50">

        {/* 顶部栏（移动端关闭按钮） */}
        <div className="md:hidden absolute top-4 left-4 z-30">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-background/50 backdrop-blur text-foreground shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* 主舞台 */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4 md:p-10">
          <div className="relative w-full max-w-2xl aspect-[16/9] rounded-xl overflow-hidden shadow-2xl shadow-black/20">
            <img
              src={currentCover}
              alt="项目封面"
              className="w-full h-full object-cover"
            />

            {/* 上传按钮遮罩 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all cursor-pointer flex items-center justify-center group"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadCloud size={48} className="text-white mb-2" />
                <p className="text-white text-base font-semibold">点击更换封面</p>
                <p className="text-white/70 text-sm">可选</p>
              </div>
            </div>
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* 右侧区域：表单 */}
      <div className="w-full md:w-[520px] bg-card flex flex-col h-[60vh] md:h-full shadow-2xl relative z-20">

        {/* 头部 */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            新建项目
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:block"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 表单主体 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">

          {/* 项目名称 */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> 项目名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="例如：2024春日写真"
              className="w-full bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-xl px-4 py-3 text-base font-bold text-foreground transition-all outline-none placeholder:text-muted-foreground/40"
              autoFocus
            />
          </div>

          {/* 客户选择 */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> 客户 <span className="text-destructive">*</span>
            </label>
            <div className="relative" ref={customerContainerRef}>
              <button
                type="button"
                onClick={() => setIsCustomerOpen(!isCustomerOpen)}
                className={cn(
                  "w-full flex items-center justify-between bg-muted/30 border-2 rounded-xl px-4 py-3 text-base font-bold transition-all outline-none",
                  isCustomerOpen ? "bg-background border-primary/20 shadow-lg" : "border-transparent hover:bg-muted/50"
                )}
              >
                <span className={cn(!selectedCustomerData && "text-muted-foreground/60")}>
                  {selectedCustomerData ? `${selectedCustomerData.name} (${selectedCustomerData.phone})` : "选择客户"}
                </span>
                <ChevronDown size={16} className={cn("text-muted-foreground transition-transform duration-200", isCustomerOpen && "rotate-180")} />
              </button>

              {isCustomerOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl animate-in fade-in-0 zoom-in-95">
                  <div className="p-1.5 max-h-[240px] overflow-y-auto">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer.id);
                          setIsCustomerOpen(false);
                        }}
                        className={cn(
                          "w-full flex flex-col items-start rounded-lg py-3 px-3 text-base font-bold transition-colors",
                          customer.id === selectedCustomer
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>{customer.name}</span>
                        <span className="text-xs font-normal opacity-70">{customer.phone}</span>
                        {customer.id === selectedCustomer && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                    {customers.length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        暂无客户
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 套餐选择 */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Package size={14} /> 套餐 <span className="text-destructive">*</span>
            </label>
            <div className="relative" ref={packageContainerRef}>
              <button
                type="button"
                onClick={() => setIsPackageOpen(!isPackageOpen)}
                className={cn(
                  "w-full flex items-center justify-between bg-muted/30 border-2 rounded-xl px-4 py-3 text-base font-bold transition-all outline-none",
                  isPackageOpen ? "bg-background border-primary/20 shadow-lg" : "border-transparent hover:bg-muted/50"
                )}
              >
                <span className={cn(!selectedPackageData && "text-muted-foreground/60")}>
                  {selectedPackageData ? selectedPackageData.name : "选择套餐"}
                </span>
                <ChevronDown size={16} className={cn("text-muted-foreground transition-transform duration-200", isPackageOpen && "rotate-180")} />
              </button>

              {isPackageOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl animate-in fade-in-0 zoom-in-95">
                  <div className="p-1.5 max-h-[240px] overflow-y-auto">
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          setSelectedPackage(pkg.id);
                          setIsPackageOpen(false);
                        }}
                        className={cn(
                          "w-full flex flex-col items-start rounded-lg py-3 px-3 text-base font-bold transition-colors",
                          pkg.id === selectedPackage
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{pkg.name}</span>
                          {pkg.id === selectedPackage && (
                            <Check size={16} strokeWidth={3} />
                          )}
                        </div>
                        <div className="text-xs font-normal opacity-70 mt-1">
                          {pkg.includedRetouchCount} 张精修 + {pkg.includedAlbumCount} 张入册
                          {pkg.price && (
                            <span className="ml-2">¥{(pkg.price / 100).toFixed(0)}</span>
                          )}
                        </div>
                      </button>
                    ))}
                    {packages.length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        暂无套餐
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 提示信息 */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              💡 <span className="font-semibold">提示：</span>
              创建后可以在项目详情页补充更多信息，如项目描述、拍摄日期等。
            </p>
          </div>

          {/* 预览信息（只读） */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">默认状态</span>
              <span className="text-sm font-medium text-amber-600">待选片</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">照片数量</span>
              <span className="text-sm font-medium">0 张</span>
            </div>
          </div>

        </form>

        {/* 底部操作栏 */}
        <div className="p-6 border-t border-border bg-card/80 backdrop-blur-md sticky bottom-0 z-10 flex flex-col gap-3">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !projectName.trim() || !selectedCustomer || !selectedPackage}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                创建中...
              </>
            ) : (
              <>
                <FileText size={20} strokeWidth={3} />
                创建项目
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-bold text-base transition-all"
          >
            取消
          </Button>
        </div>
      </div>
    </div>
  );
};
