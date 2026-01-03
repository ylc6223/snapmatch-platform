"use client";

import * as React from "react";
import {
  AlertCircle,
  Image,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  EyeOff,
  Star,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AssetUpload } from "@/components/features/upload/asset-upload";
import { cn } from "@/lib/utils";

// ==================== 类型定义 ====================

/** 作品状态 */
type WorkStatus = "draft" | "published" | "archived";

/** 作品数据结构 */
type Work = {
  id: string;
  title: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: WorkStatus;
  featured: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
};

/** 视图模式 */
type ViewMode = "grid" | "table";

// ==================== Mock 数据 ====================

const mockWorks: Work[] = [
  {
    id: "1",
    title: "夏日海滩婚纱摄影",
    coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
    category: "婚纱摄影",
    tags: ["海滩", "夏日", "自然"],
    status: "published",
    featured: true,
    content: "作品内容...",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    title: "城市夜景人像",
    coverImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    category: "人像摄影",
    tags: ["夜景", "城市", "艺术"],
    status: "published",
    featured: false,
    content: "作品内容...",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-12",
  },
  {
    id: "3",
    title: "森系清新写真",
    coverImage: null,
    category: "写真摄影",
    tags: ["森林", "清新", "自然光"],
    status: "draft",
    featured: false,
    content: "作品内容...",
    createdAt: "2024-01-08",
    updatedAt: "2024-01-08",
  },
];

const mockCategories = [
  { id: "1", name: "婚纱摄影" },
  { id: "2", name: "人像摄影" },
  { id: "3", name: "写真摄影" },
  { id: "4", name: "商业摄影" },
  { id: "5", name: "产品摄影" },
];

// ==================== 子组件 ====================

/**
 * 作品编辑对话框
 */
function WorkEditDialog({
  work,
  open,
  onOpenChange,
  onSave,
}: {
  work: Work | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (work: Work) => void;
}) {
  const [formData, setFormData] = React.useState<Partial<Work>>(
    work || {
      title: "",
      category: "",
      tags: [],
      status: "draft",
      featured: false,
      content: "",
    }
  );

  const [tagInput, setTagInput] = React.useState("");

  React.useEffect(() => {
    if (work) {
      setFormData(work);
    } else {
      setFormData({
        title: "",
        category: "",
        tags: [],
        status: "draft",
        featured: false,
        content: "",
      });
    }
    setTagInput("");
  }, [work, open]);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  const handleSave = () => {
    if (!formData.title?.trim()) {
      alert("请输入作品标题");
      return;
    }

    const savedWork: Work = {
      id: work?.id || Date.now().toString(),
      title: formData.title!,
      coverImage: work?.coverImage || null,
      category: formData.category || "",
      tags: formData.tags || [],
      status: formData.status as WorkStatus,
      featured: formData.featured || false,
      content: formData.content || "",
      createdAt: work?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    onSave(savedWork);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{work ? "编辑作品" : "新建作品"}</DialogTitle>
          <DialogDescription>
            {work ? "修改作品信息和内容" : "创建新的作品集"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                作品标题 <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="请输入作品标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  作品分类
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  发布状态
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as WorkStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 标签管理 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                作品标签
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="输入标签后按回车添加"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* 开关选项 */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">首页推荐</label>
                <p className="text-xs text-muted-foreground">
                  在首页展示此作品
                </p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked })
                }
              />
            </div>

            {/* 图片上传 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                作品图片
              </label>
              <AssetUpload
                purpose="portfolio-asset"
                uploadMode="manual"
                maxConcurrent={3}
                onSuccess={(result) => {
                  console.log("上传成功:", result);
                }}
              />
              {work?.coverImage && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    当前封面图：
                  </p>
                  <img
                    src={work.coverImage}
                    alt="封面"
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>

            {/* 作品描述 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                作品描述
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="请输入作品描述..."
                rows={5}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 删除确认对话框
 */
function DeleteConfirmDialog({
  work,
  open,
  onOpenChange,
  onConfirm,
}: {
  work: Work | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (work: Work) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            确认删除
          </DialogTitle>
          <DialogDescription>
            确定要删除作品《{work?.title}》吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (work) onConfirm(work);
              onOpenChange(false);
            }}
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 作品卡片（网格视图）
 */
function WorkCard({
  work,
  onEdit,
  onDelete,
}: {
  work: Work;
  onEdit: (work: Work) => void;
  onDelete: (work: Work) => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all">
        <div className="relative aspect-video bg-muted">
          {work.coverImage ? (
            <img
              src={work.coverImage}
              alt={work.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {work.featured && (
              <Badge className="bg-amber-500 hover:bg-amber-600">
                <Star className="h-3 w-3 mr-1" />
                推荐
              </Badge>
            )}
            <Badge
              variant={
                work.status === "published"
                  ? "default"
                  : work.status === "draft"
                  ? "secondary"
                  : "outline"
              }
            >
              {work.status === "published"
                ? "已发布"
                : work.status === "draft"
                ? "草稿"
                : "已归档"}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-base line-clamp-1">{work.title}</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>{work.category}</span>
            <span className="text-xs">{work.updatedAt}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1 mb-3">
            {work.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {work.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{work.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(work)}
            >
              <Edit className="h-4 w-4 mr-1" />
              编辑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <DeleteConfirmDialog
        work={work}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={onDelete}
      />
    </>
  );
}

// ==================== 主页面组件 ====================

export default function WorksPage() {
  const [works, setWorks] = React.useState<Work[]>(mockWorks);
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  // 编辑对话框
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [currentEditWork, setCurrentEditWork] = React.useState<Work | null>(
    null
  );

  // 删除对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [currentDeleteWork, setCurrentDeleteWork] = React.useState<Work | null>(
    null
  );

  // 筛选后的作品列表
  const filteredWorks = works.filter((work) => {
    const matchSearch =
      work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchStatus = statusFilter === "all" || work.status === statusFilter;
    const matchCategory =
      categoryFilter === "all" || work.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  // 处理保存作品
  const handleSaveWork = (work: Work) => {
    if (currentEditWork) {
      // 更新现有作品
      setWorks(works.map((w) => (w.id === work.id ? work : w)));
    } else {
      // 新建作品
      setWorks([work, ...works]);
    }
  };

  // 处理删除作品
  const handleDeleteWork = (work: Work) => {
    setWorks(works.filter((w) => w.id !== work.id));
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">作品管理</h1>
          <p className="text-muted-foreground mt-1">
            管理您的摄影作品集，包括作品编辑、分类和发布
          </p>
        </div>
        <Button onClick={() => {
          setCurrentEditWork(null);
          setEditDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          新建作品
        </Button>
      </div>

      {/* 筛选和搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* 第一行：搜索和筛选 */}
            <div className="flex gap-4">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索作品标题或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 分类筛选 */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {mockCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 第二行：视图切换和统计 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  共 {filteredWorks.length} 个作品
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">视图：</span>
                <div className="flex border rounded-md">
                  <Button
                    size="sm"
                    variant={viewMode === "table" ? "default" : "ghost"}
                    onClick={() => setViewMode("table")}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    onClick={() => setViewMode("grid")}
                    className="rounded-l-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 作品列表 */}
      {viewMode === "table" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">封面</TableHead>
                <TableHead>作品标题</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>推荐</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Image className="h-12 w-12" />
                      <p>暂无作品</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell>
                      <div className="w-16 h-16 rounded bg-muted overflow-hidden">
                        {work.coverImage ? (
                          <img
                            src={work.coverImage}
                            alt={work.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{work.title}</TableCell>
                    <TableCell>{work.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {work.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {work.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{work.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          work.status === "published"
                            ? "default"
                            : work.status === "draft"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {work.status === "published"
                          ? "已发布"
                          : work.status === "draft"
                          ? "草稿"
                          : "已归档"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {work.featured ? (
                        <Badge className="bg-amber-500 hover:bg-amber-600">
                          <Star className="h-3 w-3 mr-1" />
                          是
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{work.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentEditWork(work);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setCurrentDeleteWork(work);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Image className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">暂无作品</p>
              </CardContent>
            </Card>
          ) : (
            filteredWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onEdit={(work) => {
                  setCurrentEditWork(work);
                  setEditDialogOpen(true);
                }}
                onDelete={handleDeleteWork}
              />
            ))
          )}
        </div>
      )}

      {/* 编辑对话框 */}
      <WorkEditDialog
        work={currentEditWork}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveWork}
      />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        work={currentDeleteWork}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteWork}
      />
    </div>
  );
}
