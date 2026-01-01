import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, MapPin, ChevronRight, Home, Share2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"

const blogPosts = [
  {
    id: 1,
    slug: "sanya-wedding",
    title: "三亚海边婚礼纪实",
    date: "2024年10月15日",
    location: "海南三亚",
    featuredImage: "/placeholder.svg?height=800&width=1200",
    excerpt:
      "一对新人选择在三亚举办海边婚礼，我们有幸记录下这场浪漫的婚礼。从晨间准备的温馨时刻，到交换戒指的感动瞬间，再到夜晚派对的欢声笑语，每一张照片都承载着他们的幸福回忆。",
    content: `
# 晨光中的准备

清晨五点，三亚的海岸线刚刚泛起鱼肚白。新娘已经在化妆师的陪伴下开始了精心的准备。柔和的晨光透过薄纱窗帘洒进来，为整个房间镀上了一层温暖的金色。

新娘的母亲轻轻地为女儿整理头纱，这个瞬间让我想起了太多关于爱与传承的故事。我悄悄地按下快门，定格了这温情的一刻。

新郎在海边等待着，海风吹动着他的礼服。他望着远方，眼神中既有紧张也有期待。这是我最喜欢捕捉的瞬间——新郎在仪式前的独处时光。

# 仪式进行时

当新娘挽着父亲的手臂缓缓走向新郎时，在场的所有人都屏住了呼吸。海浪轻拍着沙滩，仿佛在为这场婚礼伴奏。

交换戒指的那一刻，阳光恰好穿过云层，洒在新人身上。大自然的巧合总是如此美好，仿佛连天空都在为他们祝福。

我选择从多个角度记录这个神圣的时刻：远景展现新人与大海的壮阔画面，特写捕捉他们眼中的泪光和嘴角的微笑。

# 欢乐的庆祝

夜幕降临，海滩派对正式开始。篝火、音乐、舞蹈，新人与朋友们尽情地庆祝这个特殊的日子。

我特别记录了几个有趣的瞬间：新郎背着新娘踩水的欢乐场景，朋友们围成圈跳舞的欢快场面，还有两位新人悄悄溜到海边独处的浪漫时光。

# 摄影师的思考

这场婚礼让我再次感受到，每一场婚礼都是独一无二的。三亚的海边风光提供了绝佳的背景，但真正让照片有灵魂的，是新人之间真挚的情感流露。

作为摄影师，我的任务不仅是记录画面，更是捕捉那些稍纵即逝的情感瞬间。这些瞬间，才是多年后回看时最珍贵的回忆。
    `,
    tags: ["婚礼摄影", "纪实", "海岛", "三亚"],
    photographer: "独立摄影师",
    readingTime: "8 分钟",
  },
  {
    id: 2,
    slug: "autumn-portrait",
    title: "秋日城市人像写真",
    date: "2024年11月20日",
    location: "上海外滩",
    featuredImage: "/placeholder.svg?height=800&width=1200",
    excerpt:
      "以城市秋色为背景，为客户打造一套温暖而富有文艺气息的个人写真。金黄的落叶、复古的建筑、柔和的阳光，与客户的气质完美融合，呈现出独特的都市文艺风格。",
    content: `
# 前期策划

这次拍摄的主题是"都市秋日"。客户希望能够在城市环境中展现秋天的氛围，同时保持个人写真的文艺气息。

我们选择了上海外滩作为拍摄地点，这里既有现代化的摩天大楼，也有历史悠久的外国建筑群。更重要的是，深秋时节的落叶为整个场景增添了浓厚的秋意。

# 场景一：外白渡桥

清晨七点，我们开始了第一组拍摄。外白渡桥在晨光中显得格外有质感，桥下的苏州河静静流淌。

让客户倚靠在栏杆上，背景是浦东的摩天大楼。我故意选择大光圈虚化背景,让建筑成为模糊的色块,突出人物主体。

一阵风吹过,几片银杏叶飘落在镜头前。我立即捕捉了这个偶然的瞬间——正是这些不可预知的细节,让照片有了生命力。

# 场景二：外滩建筑群

上午十点,阳光角度正好。我们来到外滩的万国建筑群前。这些历史建筑本身就是绝佳的背景。

我特别钟爱其中一栋建筑的拱门设计。让客户站在拱门下,利用自然光勾勒出她的侧脸轮廓。这种经典的布光方式永远不会过时。

我们还利用了建筑前的梧桐树。满地金黄的落叶成为天然的道具,客户随意地坐在落叶堆中,我则从低角度仰拍,让人物与秋天的天空和建筑融为一体。

# 场景三：街角咖啡馆

下午三点,我们转移到了一条安静的街道。这里有一家复古风格的咖啡馆,完美契合我们的拍摄主题。

在咖啡馆的露台上,我们拍摄了最后一组照片。客户点了一杯热咖啡,我让她自然地望向远方,然后抓拍下她若有所思的表情。

这张照片后来成为了她最喜欢的一张。她说,这就是她理想中的自己——在繁华都市中,保持着内心的宁静。

# 后期思路

这组照片的后期处理,我采用了温暖的色调。轻微增加了黄色和橙色的饱和度,让秋天的感觉更加浓郁。

同时,我保留了皮肤的质感,不过度磨皮,因为真实的美远比完美的假象更有打动人心的力量。

# 拍摄感悟

城市人像摄影最大的魅力在于,将人物与城市环境有机结合。这次拍摄让我再次确信,最好的照片往往是那些看起来毫不费力的瞬间。
    `,
    tags: ["人像摄影", "写真", "城市", "秋天"],
    photographer: "独立摄影师",
    readingTime: "6 分钟",
  },
  {
    id: 3,
    slug: "graduation-season",
    title: "校园毕业季拍摄",
    date: "2024年6月28日",
    location: "北京大学",
    featuredImage: "/placeholder.svg?height=800&width=1200",
    excerpt:
      "为即将毕业的学子们记录下青春最美好的时光。从图书馆的专注瞬间，到操场的自由奔跑，再到未名湖畔的深情凝望，用镜头定格他们的青春记忆与同窗情谊。",
    content: `
# 四人,四年

这次拍摄的对象是四位即将毕业的北京大学同学。他们来自同一个专业,四年来一起上课、一起自习、一起熬夜赶论文。

"我们想记录下最后的校园时光,"其中一位同学说,"以后大家各奔东西,这样的机会可能再也没有了。"

这句话让我意识到,毕业季摄影的意义远不止拍几张好看的照片,而是在为一段青春画上句号。

# 场景一:图书馆的清晨

早上六点,我们来到了北京大学图书馆。清晨的阳光透过落地窗洒进阅览室,整个空间安静而神圣。

四位同学坐在他们最熟悉的位置上——这个角落陪伴了他们无数个日日夜夜。我让他们保持自然的状态,有的在看书,有的在思考,有的在望向窗外。

我没有刻意让他们摆拍,因为最真实的青春,本就应该是不加修饰的。

# 场景二:博雅塔下

上午九点,我们来到了博雅塔前。这是北大的标志性建筑,也是所有毕业生必打卡的地点。

但我没有让他们站在塔前拍标准的游客照。相反,我建议他们在塔下奔跑、跳跃,就像四年来的无数个日子一样。

抓拍的瞬间,四个人笑得前仰后合。这张照片后来成为了他们最喜欢的一张,因为那是最真实的他们。

# 场景三:未名湖畔

下午四点,阳光斜射在未名湖上,湖面波光粼粼。这是校园里最适合拍摄的时间。

我们沿着湖边慢慢走,记录下他们并肩而行、彼此交谈的画面。有时候,最好的照片不是精心设计的场景,而是陪伴的日常。

在湖边的柳树下,他们站成一排,背对着镜头望向湖面。这个构图象征着即将到来的离别,但也预示着各自光明的未来。

# 场景四:操场的黄昏

傍晚时分,我们来到了操场。金色的夕阳洒在跑道上,整个场地都被染成了温暖的橘红色。

"跑吧!"我喊道。

四个人像疯了一样在跑道上狂奔,跑到气喘吁吁,跑到笑出了眼泪。我按下了快门,记录下这释放青春的一刻。

# 最后的合影

拍摄结束前,我让他们站在一起,拍一张正式的毕业照。但他们说:"太正式了,不像我们。"

于是,他们决定背对镜头,举起右手比出"四"的手势——代表他们四个人,也代表这四年。

这个创意很棒,因为它独特、有趣,并且只属于他们。

# 致青春

整理这些照片时,我想起了自己的毕业季。那些曾经以为永远不会忘记的瞬间,如果不记录,真的会慢慢模糊。

这就是为什么我热爱毕业季摄影。我不仅是摄影师,更是青春的见证者。
    `,
    tags: ["毕业季", "纪实", "校园", "团体拍摄"],
    photographer: "独立摄影师",
    readingTime: "7 分钟",
  },
]

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    id: post.id.toString(),
  }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = blogPosts.find((p) => p.id === Number.parseInt(id))

  if (!post) {
    notFound()
  }

  return (
    <article className="min-h-screen bg-background">
      {/* Shared Header */}
      <Header />

      {/* Breadcrumb Navigation - Simplified */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span>首页</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          <Link href="/#cases" className="hover:text-foreground transition-colors">
            客户案例
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          <span className="text-foreground font-medium truncate max-w-[300px]">
            {post.title}
          </span>
        </nav>
      </div>

      {/* Featured Image */}
      <div className="relative w-full h-[75vh] min-h-[600px]">
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Article Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 py-12 -mt-32 relative">
          {/* Main Article - 8 columns */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-background/95 backdrop-blur rounded-2xl p-8 shadow-lg">
              {/* Title with Share Button */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight flex-1">
                  {post.title}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full shrink-0 hover:bg-muted"
                  title="分享文章"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8 pb-8 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <time dateTime={post.date}>{post.date}</time>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{post.location}</span>
                </div>
                <span className="text-sm">阅读时间: {post.readingTime}</span>
              </div>

              {/* Excerpt */}
              <p className="text-xl leading-relaxed text-muted-foreground mb-8">
                {post.excerpt}
              </p>

              {/* Article Body */}
              <div className="prose prose-lg max-w-none">
                {post.content.split('\n\n').map((paragraph, index) => {
                  // Check if it's a heading
                  if (paragraph.startsWith('# ')) {
                    return (
                      <h2 key={index} className="text-3xl font-bold mt-12 mb-6 first:mt-0">
                        {paragraph.replace('# ', '')}
                      </h2>
                    )
                  }
                  // Regular paragraph
                  return (
                    <p key={index} className="text-base leading-relaxed mb-6 text-foreground/90">
                      {paragraph}
                    </p>
                  )
                })}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-muted/30 rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-3">标签</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 4 columns */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Photographer Info */}
              <div className="bg-background/95 backdrop-blur rounded-2xl p-8 shadow-lg">
                <h3 className="font-semibold mb-4">关于摄影师</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>{post.photographer}</p>
                  <p>
                    热爱摄影，专注于记录生活中的美好瞬间。用独特的视角和真挚的情感，为你留下值得珍藏的影像回忆。
                  </p>
                </div>
                <Link
                  href="/#contact"
                  className="mt-4 block w-full text-center"
                >
                  <Button className="w-full rounded-full">预约咨询</Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="bg-background/95 backdrop-blur rounded-2xl p-8 shadow-lg">
                <h3 className="font-semibold mb-4">拍摄信息</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">拍摄日期</dt>
                    <dd className="font-medium">{post.date}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">拍摄地点</dt>
                    <dd className="font-medium">{post.location}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">阅读时间</dt>
                    <dd className="font-medium">{post.readingTime}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Related Stories Section */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold mb-8">更多故事</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {blogPosts
              .filter((p) => p.id !== post.id)
              .slice(0, 3)
              .map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.id}`}
                  className="group block"
                >
                  <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <img
                      src={relatedPost.featuredImage}
                      alt={relatedPost.title}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="p-6">
                      <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </article>
  )
}
