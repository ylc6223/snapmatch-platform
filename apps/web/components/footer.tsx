import Link from "next/link"
import { Camera } from "lucide-react"
import { SocialIcon } from "@/components/social-icon"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 transition-colors duration-300 ease-in-out">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Camera className="h-8 w-8" />
              <span className="text-xl font-bold">一拍即合</span>
            </Link>
            <p className="mt-4 max-w-md text-muted-foreground">
              用镜头记录生活，用照片讲述故事。相信每一张照片都承载着独特的故事和情感，每一次快门都是一次美好的相遇。
            </p>
            <div className="mt-6 flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <SocialIcon name="wechat" className="h-6 w-6" />
                <span className="sr-only">微信</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <SocialIcon name="weibo" className="h-6 w-6" />
                <span className="sr-only">微博</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <SocialIcon name="douyin" className="h-6 w-6" />
                <span className="sr-only">抖音</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <SocialIcon name="xiaohongshu" className="h-6 w-6" />
                <span className="sr-only">小红书</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">快速链接</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link href="/#portfolio" className="text-muted-foreground hover:text-foreground transition-colors">
                  作品集
                </Link>
              </li>
              <li>
                <Link href="/#cases" className="text-muted-foreground hover:text-foreground transition-colors">
                  案例展示
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-muted-foreground hover:text-foreground transition-colors">
                  关于我
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  常见问题
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">服务项目</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-foreground transition-colors">
                  个人写真
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-foreground transition-colors">
                  日常跟拍
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-foreground transition-colors">
                  婚礼摄影
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-foreground transition-colors">
                  活动记录
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-foreground transition-colors">
                  静物摄影
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2025 一拍即合. 保留所有权利.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/#contact" className="hover:text-foreground transition-colors">
              联系我们
            </Link>
            <Link href="/#faq" className="hover:text-foreground transition-colors">
              常见问题
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
