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
import { apiFetch, getApiErrorMessage } from "@/lib/api/client";
import { type ApiResponse } from "@/lib/api/response";
import { withAdminBasePath } from "@/lib/routing/base-path";
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from "@/lib/types/customer";

interface CustomerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  customer?: Customer | null; // 如果有值则为编辑模式
}

export function CustomerFormDialog({
  isOpen,
  onClose,
  onSuccess,
  customer,
}: CustomerFormDialogProps) {
  const isEditing = Boolean(customer);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateCustomerInput>({
    name: customer?.name || "",
    phone: customer?.phone || "",
    wechatOpenId: customer?.wechatOpenId || "",
    email: customer?.email || "",
    notes: customer?.notes || "",
    tags: customer?.tags || [],
  });

  const handleInputChange = <K extends keyof CreateCustomerInput>(
    field: K,
    value: CreateCustomerInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本验证
    if (!formData.name.trim()) {
      toast.error("请输入客户姓名");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("请输入手机号");
      return;
    }

    try {
      setIsSubmitting(true);

      const url = isEditing
        ? withAdminBasePath(`/api/customers/${customer!.id}`)
        : withAdminBasePath("/api/customers");

      const method = isEditing ? "PATCH" : "POST";

      await apiFetch<ApiResponse<unknown>>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      toast.success(isEditing ? "客户更新成功" : "客户创建成功");
      onSuccess?.();
      onClose();

      // 重置表单
      setFormData({
        name: "",
        phone: "",
        wechatOpenId: "",
        email: "",
        notes: "",
        tags: [],
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "操作失败"));
      console.error("提交客户表单失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        phone: "",
        wechatOpenId: "",
        email: "",
        notes: "",
        tags: [],
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑客户" : "新建客户"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "修改客户档案信息"
                : "填写客户基本信息以创建新档案"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                客户姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="请输入客户姓名"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">
                手机号 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="请输入手机号"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="选填"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="wechatOpenId">微信 OpenID</Label>
              <Input
                id="wechatOpenId"
                value={formData.wechatOpenId}
                onChange={(e) =>
                  handleInputChange("wechatOpenId", e.target.value)
                }
                placeholder="选填"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">备注说明</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="选填，可以记录客户的其他信息"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                value={formData.tags?.join(",") || ""}
                onChange={(e) =>
                  handleInputChange(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="选填，多个标签用逗号分隔，如：VIP,老客户"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                多个标签请用英文逗号分隔
              </p>
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
                : "创建客户"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
