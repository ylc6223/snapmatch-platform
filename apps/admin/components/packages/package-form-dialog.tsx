"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiFetch, getApiErrorMessage } from "@/lib/api/client";
import { type ApiResponse } from "@/lib/api/response";
import { withAdminBasePath } from "@/lib/routing/base-path";
import type { Package, CreatePackageInput, UpdatePackageInput } from "@/lib/types/package";

interface PackageFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  package?: Package | null; // 如果有值则为编辑模式
}

export function PackageFormDialog({
  isOpen,
  onClose,
  onSuccess,
  package: pkg,
}: PackageFormDialogProps) {
  const isEditing = Boolean(pkg);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<CreatePackageInput>({
    name: pkg?.name || "",
    description: pkg?.description || "",
    includedRetouchCount: pkg?.includedRetouchCount ?? 0,
    includedAlbumCount: pkg?.includedAlbumCount ?? 0,
    includeAllOriginals: pkg?.includeAllOriginals ?? false,
    price: pkg?.price ?? undefined,
    extraRetouchPrice: pkg?.extraRetouchPrice ?? 0,
    extraAlbumPrice: pkg?.extraAlbumPrice ?? 0,
    isActive: pkg?.isActive ?? true,
    sort: pkg?.sort ?? 0,
  });

  const handleInputChange = <K extends keyof CreatePackageInput>(
    field: K,
    value: CreatePackageInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本验证
    if (!formData.name.trim()) {
      toast.error("请输入套餐名称");
      return;
    }
    if (formData.includedRetouchCount < 0) {
      toast.error("精修张数不能为负数");
      return;
    }
    if (formData.includedAlbumCount < 0) {
      toast.error("入册张数不能为负数");
      return;
    }
    if (formData.extraRetouchPrice < 0) {
      toast.error("超额精修单价不能为负数");
      return;
    }
    if (formData.extraAlbumPrice < 0) {
      toast.error("超额入册单价不能为负数");
      return;
    }

    try {
      setIsSubmitting(true);

      const url = isEditing
        ? withAdminBasePath(`/api/packages/${pkg!.id}`)
        : withAdminBasePath("/api/packages");

      const method = isEditing ? "PATCH" : "POST";

      await apiFetch<ApiResponse<unknown>>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      toast.success(isEditing ? "套餐更新成功" : "套餐创建成功");
      onSuccess?.();
      onClose();

      // 重置表单
      setFormData({
        name: "",
        description: "",
        includedRetouchCount: 0,
        includedAlbumCount: 0,
        includeAllOriginals: false,
        price: undefined,
        extraRetouchPrice: 0,
        extraAlbumPrice: 0,
        isActive: true,
        sort: 0,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "操作失败"));
      console.error("提交套餐表单失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        description: "",
        includedRetouchCount: 0,
        includedAlbumCount: 0,
        includeAllOriginals: false,
        price: undefined,
        extraRetouchPrice: 0,
        extraAlbumPrice: 0,
        isActive: true,
        sort: 0,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑套餐" : "新建套餐"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "修改套餐配置信息"
                : "填写套餐基本信息以创建新套餐"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 基本信息 */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                套餐名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="例如：基础套餐、标准套餐"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">套餐描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="选填，描述套餐的特点和适用场景"
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {/* 包含内容 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="includedRetouchCount">
                  包含精修张数 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="includedRetouchCount"
                  type="number"
                  min={0}
                  value={formData.includedRetouchCount}
                  onChange={(e) =>
                    handleInputChange("includedRetouchCount", parseInt(e.target.value) || 0)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="includedAlbumCount">
                  包含入册张数 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="includedAlbumCount"
                  type="number"
                  min={0}
                  value={formData.includedAlbumCount}
                  onChange={(e) =>
                    handleInputChange("includedAlbumCount", parseInt(e.target.value) || 0)
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="includeAllOriginals">底片全送</Label>
                <p className="text-xs text-muted-foreground">
                  是否包含所有原片
                </p>
              </div>
              <Switch
                id="includeAllOriginals"
                checked={formData.includeAllOriginals}
                onCheckedChange={(checked) =>
                  handleInputChange("includeAllOriginals", checked)
                }
                disabled={isSubmitting}
              />
            </div>

            {/* 价格设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">套餐价格（元）</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price ? formData.price / 100 : ""}
                  onChange={(e) =>
                    handleInputChange("price", e.target.value ? parseFloat(e.target.value) * 100 : undefined)
                  }
                  placeholder="选填"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  留空则不显示价格
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sort">排序</Label>
                <Input
                  id="sort"
                  type="number"
                  min={0}
                  value={formData.sort}
                  onChange={(e) => handleInputChange("sort", parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  数字越小越靠前
                </p>
              </div>
            </div>

            {/* 超额价格 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="extraRetouchPrice">
                  超额精修单价（元/张） <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="extraRetouchPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.extraRetouchPrice / 100}
                  onChange={(e) =>
                    handleInputChange("extraRetouchPrice", parseFloat(e.target.value) * 100 || 0)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="extraAlbumPrice">
                  超额入册单价（元/张） <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="extraAlbumPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.extraAlbumPrice / 100}
                  onChange={(e) =>
                    handleInputChange("extraAlbumPrice", parseFloat(e.target.value) * 100 || 0)
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 状态设置 */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">启用状态</Label>
                <p className="text-xs text-muted-foreground">
                  禁用后创建项目时将不显示此套餐
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "提交中..."
                : isEditing
                ? "保存修改"
                : "创建套餐"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
