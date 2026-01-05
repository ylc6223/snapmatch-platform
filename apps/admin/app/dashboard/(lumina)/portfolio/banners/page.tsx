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
  Image as ImageIcon,
  Calendar,
  ExternalLink,
  Eye,
  EyeOff,
  Clock,
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
import { AssetUpload } from "@/components/features/upload/asset-upload";
import { cn } from "@/lib/utils";

// ==================== 类型定义 ====================

/** 轮播图数据结构 */
type Banner = {
  id: string;
  assetId: string;
  assetUrl: string;
  title: string | null;
  link: string | null;
  sort: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ==================== Mock 数据 ====================

const mockBanners: Banner[] = [
  {
    id: "1",
    assetId: "asset1",
    assetUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
    title: "2024夏季婚纱摄影特惠",
    link: "/promotions/summer-2024",
    sort: 1,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    assetId: "asset2",
    assetUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
    title: "专业人像摄影服务",
    link: "/services/portrait",
    sort: 2,
    startDate: "2024-01-01",
    endDate: null,
    isActive: true,
    createdAt: "2024-01-02",
    updatedAt: "2024-01-10",
  },
  {
    id: "3",
    assetId: "asset3",
    assetUrl:
      "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800",
    title: null,
    link: null,
    sort: 3,
    startDate: null,
    endDate: null,
    isActive: false,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-05",
  },
];

// ==================== 子组件 ====================

/**
 * 轮播图编辑对话框
 */
function BannerEditDialog({
  banner,
  open,
  onOpenChange,
  onSave,
}: {
  banner: Banner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (banner: Banner) => void;
}) {
  const [formData, setFormData] = React.useState<Partial<Banner>>(
    banner || {
      assetId: "",
      assetUrl: "",
      title: "",
      link: "",
      sort: 1,
      startDate: "",
      endDate: "",
      isActive: true,
    }
  );

  React.useEffect(() => {
    if (banner) {
      setFormData(banner);
    } else {
      setFormData({
        assetId: "",
        assetUrl: "",
        title: "",
        link: "",
        sort: 1,
        startDate: "",
        endDate: "",
        isActive: true,
      });
    }
  }, [banner, open]);

  const handleSave = () => {
    if (!formData.assetUrl) {
      alert("请先上传轮播图图片");
      return;
    }

    const savedBanner: Banner = {
      id: banner?.id || Date.now().toString(),
      assetId: formData.assetId || "",
      assetUrl: formData.assetUrl!,
      title: formData.title || null,
      link: formData.link || null,
      sort: formData.sort || 1,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      isActive: formData.isActive ?? true,
      createdAt: banner?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    onSave(savedBanner);
    onOpenChange(false);
  };

  const handleUploadSuccess = (result: any) => {
    // 假设上传成功后返回 assetId 和 URL
    setFormData({
      ...formData,
      assetId: result.objectKey || Date.now().toString(),
      assetUrl: result.url || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "编辑轮播图" : "新建轮播图"}</DialogTitle>
          <DialogDescription>
            {banner ? "修改轮播图配置" : "添加新的首页轮播图"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 图片上传 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              轮播图图片 <span className="text-destructive">*</span>
            </label>
            <AssetUpload
              purpose="portfolio-asset"
              mode="manual"
              concurrency={1}
              onAllComplete={(items) => {
                const completedItem = items.find(item => item.status === 'success');
                if (completedItem?.objectKey) {
                  // 构建上传成功的结果对象
                  handleUploadSuccess({
                    objectKey: completedItem.objectKey,
                    url: completedItem.objectKey ? `/api/assets/${completedItem.objectKey}` : '',
                  });
                }
              }}
            />
            {formData.assetUrl && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">预览：</p>
                <img
                  src={formData.assetUrl}
                  alt="轮播图预览"
                  className="w-full max-w-md rounded border"
                />
              </div>
            )}
          </div>

          {/* 标题 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              标题（可选）
            </label>
            <Input
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="轮播图标题，用于辅助说明"
            />
          </div>

          {/* 链接 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              跳转链接（可选）
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.link || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="/page-url 或 https://..."
                  className="pl-10"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              支持相对路径（/page）或绝对路径（https://...）
            </p>
          </div>

          {/* 排序 */}
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
          </div>

          {/* 生效日期范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                开始日期
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                结束日期
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            留空表示不限制时间。只有在开始日期到结束日期之间的轮播图才会展示。
          </p>

          {/* 启用开关 */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">启用轮播图</label>
              <p className="text-xs text-muted-foreground">
                关闭后轮播图将不会在首页显示
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
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
  banner,
  open,
  onOpenChange,
  onConfirm,
}: {
  banner: Banner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (banner: Banner) => void;
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
            确定要删除此轮播图吗？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (banner) onConfirm(banner);
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

export default function BannersPage() {
  const [banners, setBanners] = React.useState<Banner[]>(
    mockBanners.sort((a, b) => a.sort - b.sort)
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  // 编辑对话框
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [currentEditBanner, setCurrentEditBanner] =
    React.useState<Banner | null>(null);

  // 删除对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [currentDeleteBanner, setCurrentDeleteBanner] =
    React.useState<Banner | null>(null);

  // 筛选后的轮播图列表
  const filteredBanners = banners.filter((banner) =>
    banner.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理保存轮播图
  const handleSaveBanner = (banner: Banner) => {
    if (currentEditBanner) {
      // 更新现有轮播图
      setBanners(
        banners.map((b) => (b.id === banner.id ? banner : b))
      );
    } else {
      // 新建轮播图
      setBanners([...banners, banner].sort((a, b) => a.sort - b.sort));
    }
  };

  // 处理删除轮播图
  const handleDeleteBanner = (banner: Banner) => {
    setBanners(banners.filter((b) => b.id !== banner.id));
  };

  // 处理上移
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    [newBanners[index - 1], newBanners[index]] = [
      newBanners[index],
      newBanners[index - 1],
    ];
    // 更新排序值
    newBanners.forEach((banner, i) => {
      banner.sort = i + 1;
    });
    setBanners(newBanners);
  };

  // 处理下移
  const handleMoveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [
      newBanners[index + 1],
      newBanners[index],
    ];
    // 更新排序值
    newBanners.forEach((banner, i) => {
      banner.sort = i + 1;
    });
    setBanners(newBanners);
  };

  // 检查轮播图是否在有效期内
  const isBannerActive = (banner: Banner) => {
    if (!banner.isActive) return false;

    const now = new Date();
    if (banner.startDate && new Date(banner.startDate) > now) return false;
    if (banner.endDate && new Date(banner.endDate) < now) return false;

    return true;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">轮播图配置</h1>
          <p className="text-muted-foreground mt-1">
            管理首页轮播图，设置展示时间和链接
          </p>
        </div>
        <Button
          onClick={() => {
            setCurrentEditBanner(null);
            setEditDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          添加轮播图
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              总轮播图数
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banners.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              已配置的轮播图
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              展示中
            </CardTitle>
            <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {banners.filter((b) => isBannerActive(b)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              当前正在展示
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              已停用
            </CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {banners.filter((b) => !isBannerActive(b)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              未启用或已过期
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
              placeholder="搜索轮播图标题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 轮播图列表 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">排序</TableHead>
              <TableHead className="w-[200px]">预览</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>链接</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBanners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                    <p>暂无轮播图</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBanners.map((banner, index) => (
                <TableRow key={banner.id}>
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
                          disabled={index === filteredBanners.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-32 h-16 rounded bg-muted overflow-hidden">
                      {banner.assetUrl ? (
                        <img
                          src={banner.assetUrl}
                          alt={banner.title || "轮播图"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {banner.title || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {banner.link ? (
                      <Badge variant="outline" className="font-mono text-xs max-w-[150px] truncate">
                        {banner.link}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {banner.startDate && (
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{banner.startDate}</span>
                        </div>
                      )}
                      {banner.endDate && (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{banner.endDate}</span>
                        </div>
                      )}
                      {!banner.startDate && !banner.endDate && (
                        <span className="text-xs text-muted-foreground">不限</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isBannerActive(banner) ? (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        <Eye className="h-3 w-3 mr-1" />
                        展示中
                      </Badge>
                    ) : banner.isActive ? (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        未到期
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 mr-1" />
                        已停用
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{banner.updatedAt}</TableCell>
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
                            setCurrentEditBanner(banner);
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
                            setCurrentDeleteBanner(banner);
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
      <BannerEditDialog
        banner={currentEditBanner}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveBanner}
      />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        banner={currentDeleteBanner}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteBanner}
      />
    </div>
  );
}
