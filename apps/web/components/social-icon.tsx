import Image from "next/image"

interface SocialIconProps {
  name: "wechat" | "weibo" | "douyin" | "xiaohongshu"
  className?: string
}

export function SocialIcon({ name, className }: SocialIconProps) {
  const iconMap = {
    wechat: "/icons/social/wechat.svg",
    weibo: "/icons/social/weibo.svg",
    douyin: "/icons/social/douyin.svg",
    xiaohongshu: "/icons/social/xiaohongshu.svg",
  }

  return (
    <Image
      src={iconMap[name]}
      alt={name}
      width={24}
      height={24}
      className={className}
    />
  )
}
