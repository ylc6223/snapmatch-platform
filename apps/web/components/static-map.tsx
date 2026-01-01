import { MapPin } from "lucide-react"

interface StaticMapProps {
  lat?: number
  lng?: number
  zoom?: number
  width?: number
  height?: number
  className?: string
}

export function StaticMap({
  lat = 23.39,
  lng = 110.08,
  zoom = 14,
  width = 800,
  height = 400,
  className = "",
}: StaticMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_AMAP_KEY

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">地图加载中...</p>
        </div>
      </div>
    )
  }

  // 高德地图静态图API
  const mapUrl = `https://restapi.amap.com/v3/staticmap?location=${lng},${lat}&zoom=${zoom}&size=${width}*${height}&markers=mid,,A:${lng},${lat}&key=${apiKey}`

  return (
    <div className={`overflow-hidden shadow-lg ${className}`}>
      <img
        src={mapUrl}
        alt="地图位置"
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  )
}
