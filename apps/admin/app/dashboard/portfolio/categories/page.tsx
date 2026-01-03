"use client";

import * as React from "react";
import {
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Search,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Folder,
  FolderOpen,
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ==================== 类型定义 ====================

/** 分类数据结构 */
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort: number;
  workCount: number;
  createdAt: string;
  updatedAt: string;
};

// ==================== Mock 数据 ====================

const mockCategories: Category[] = [
  {
    id: "1",
    name: "婚纱摄影",
    slug: "wedding",
    description: "专业婚纱摄影作品",
    sort: 1,
    workCount: 25,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    name: "人像摄影",
    slug: "portrait",
    description: "艺术人像写真",
    sort: 2,
    workCount: 18,
    createdAt: "2024-01-02",
    updatedAt: "2024-01-10",
  },
  {
    id: "3",
    name: "写真摄影",
    slug: "photoshoot",
    description: "个人写真作品",
    sort: 3,
    workCount: 12,
    createdAt: "2024-01-03",
    updatedAt: "2024-01-08",
  },
  {
    id: "4",
    name: "商业摄影",
    slug: "commercial",
    description: "商业产品摄影",
    sort: 4,
    workCount: 8,
    createdAt: "2024-01-04",
    updatedAt: "2024-01-05",
  },
  {
    id: "5",
    name: "产品摄影",
    slug: "product",
    description: "产品展示摄影",
    sort: 5,
    workCount: 5,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-05",
  },
];

// ==================== 子组件 ====================

/**
 * 分类编辑对话框
 */
function CategoryEditDialog({
  category,
  open,
  onOpenChange,
  onSave,
}: {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (category: Category) => void;
}) {
  const [formData, setFormData] = React.useState<Partial<Category>>(
    category || {
      name: "",
      slug: "",
      description: "",
      sort: 1,
    }
  );

  React.useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        sort: 1,
      });
    }
  }, [category, open]);

  // 自动生成 slug
  React.useEffect(() => {
    if (formData.name && !category) {
      const slug = formData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "");
      setFormData({ ...formData, slug });
    }
  }, [formData.name]);

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert("请输入分类名称");
      return;
    }

    const savedCategory: Category = {
      id: category?.id || Date.now().toString(),
      name: formData.name!,
      slug: formData.slug || "",
      description: formData.description || "",
      sort: formData.sort || 1,
      workCount: category?.workCount || 0,
      createdAt: category?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    onSave(savedCategory);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{category ? "编辑分类" : "新建分类"}</DialogTitle>
          <DialogDescription>
            {category ? "修改分类信息" : "创建新的作品分类"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              分类名称 <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="请输入分类名称"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              URL 标识 (Slug)
            </label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="自动生成或手动输入"
            />
            <p className="text-xs text-muted-foreground mt-1">
              用于 URL 的英文字符标识，建议使用小写字母和连字符
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="请输入分类描述..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              排序顺序
            </label>
            <Input
              type="number"
              value={formData.sort}
              onChange={(e) =>
                setFormData({ ...formData, sort: Number(e.target.value) })
              }
              min={1}
            />
            <p className="text-xs text-muted-foreground mt-1">
              数值越小排序越靠前
            </p>
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
  category,
  open,
  onOpenChange,
  onConfirm,
}: {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (category: Category) => void;
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
            确定要删除分类"【{category?.name}】"吗？
            {category && category.workCount > 0 && (
              <span className="block mt-2 text-amber-600 dark:text-amber-400">
                ⚠️ 该分类下有 {category.workCount} 个作品，删除后需要重新分配作品分类。
              </span>
            )}
            此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (category) onConfirm(category);
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

// ==================== 主页面组件 ====================

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>(
    mockCategories.sort((a, b) => a.sort - b.sort)
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  // 编辑对话框
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [currentEditCategory, setCurrentEditCategory] =
    React.useState<Category | null>(null);

  // 删除对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [currentDeleteCategory, setCurrentDeleteCategory] =
    React.useState<Category | null>(null);

  // 筛选后的分类列表
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理保存分类
  const handleSaveCategory = (category: Category) => {
    if (currentEditCategory) {
      // 更新现有分类
      setCategories(
        categories.map((c) => (c.id === category.id ? category : c))
      );
    } else {
      // 新建分类
      setCategories([...categories, category].sort((a, b) => a.sort - b.sort));
    }
  };

  // 处理删除分类
  const handleDeleteCategory = (category: Category) => {
    setCategories(categories.filter((c) => c.id !== category.id));
  };

  // 处理上移
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newCategories = [...categories];
    [newCategories[index - 1], newCategories[index]] = [
      newCategories[index],
      newCategories[index - 1],
    ];
    // 更新排序值
    newCategories.forEach((cat, i) => {
      cat.sort = i + 1;
    });
    setCategories(newCategories);
  };

  // 处理下移
  const handleMoveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [
      newCategories[index + 1],
      newCategories[index],
    ];
    // 更新排序值
    newCategories.forEach((cat, i) => {
      cat.sort = i + 1;
    });
    setCategories(newCategories);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">分类管理</h1>
          <p className="text-muted-foreground mt-1">
            管理作品分类，用于组织和展示您的作品集
          </p>
        </div>
        <Button
          onClick={() => {
            setCurrentEditCategory(null);
            setEditDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          新建分类
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              总分类数
            </CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              作品分类总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              作品总数
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + cat.workCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              所有分类下的作品
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              已使用分类
            </CardTitle>
            <Badge variant="default" className="text-xs">
              活跃
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter((cat) => cat.workCount > 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              有作品的分类
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索分类名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 分类列表 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">排序</TableHead>
              <TableHead>分类名称</TableHead>
              <TableHead>URL 标识</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>作品数</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Folder className="h-12 w-12" />
                    <p>暂无分类</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <div className="flex flex-col">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === filteredCategories.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {category.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.workCount}</Badge>
                  </TableCell>
                  <TableCell>{category.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <GripVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setCurrentEditCategory(category);
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
                            setCurrentDeleteCategory(category);
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

      {/* 编辑对话框 */}
      <CategoryEditDialog
        category={currentEditCategory}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveCategory}
      />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        category={currentDeleteCategory}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
