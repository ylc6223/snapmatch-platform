import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "拍摄费用如何计算？",
    answer: "费用根据拍摄类型、时长和地点有所不同。个人写真起步价 500 元，日常跟拍 800 元/小时，婚礼摄影根据套餐从 3000 元起。具体价格可以加微信详聊，我会根据你的需求给出最合适的方案。",
  },
  {
    question: "需要提前多久预约？",
    answer: "建议提前 1-2 周预约，尤其是周末和节假日档期比较紧张。如果是婚礼摄影，建议至少提前 1 个月预约。临时有档位的话也可以安排，具体可以咨询客服。",
  },
  {
    question: "拍摄后多久能拿到照片？",
    answer: "一般情况下，个人写真 3-5 个工作日，日常跟拍和活动记录 5-7 个工作日，婚礼摄影 10-15 个工作日。精修照片会另外安排时间，通常每张精修需要 1-2 个工作日。",
  },
  {
    question: "可以提供精修服务吗？",
    answer: "可以的！每次拍摄都会包含一定数量的精修照片（通常 10-20 张，根据拍摄类型而定）。如果需要额外精修，每张 50 元。精修包括调色、修图、去除瑕疵等，确保每一张照片都完美。",
  },
  {
    question: "拍摄地点有什么要求？",
    answer: "拍摄地点可以由你来定，也可以我推荐。北京市内任何地点都可以，包括室内、户外、公园、咖啡厅等。如果需要到外地拍摄，需要另外支付差旅费用。",
  },
  {
    question: "需要自己准备服装道具吗？",
    answer: "服装需要自己准备，建议带 2-3 套不同风格的衣服，方便拍摄多种风格。道具我可以提供一些基础的，如果需要特殊道具可以提前沟通，我会尽量帮你准备或者给出购买建议。",
  },
  {
    question: "天气不好怎么办？",
    answer: "如果拍摄当天遇到恶劣天气（如下雨、大风、雾霾等），我们可以免费改期。如果只是阴天或多云，不影响拍摄的话，也可以按原计划进行。我会提前关注天气预报，和你保持沟通。",
  },
  {
    question: "可以退改预约吗？",
    answer: "可以改期，但需要提前 3 天通知。拍摄前 3 天内改期需要支付 20% 的改期费。如果因个人原因需要取消，已支付的费用不退还，但可以保留 6 个月，期间预约可直接抵扣。",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">常见问题</h2>
          <p className="mt-4 text-lg text-muted-foreground">关于拍摄的疑问，这里都有解答</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                <AccordionTrigger className="text-lg font-medium hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            还有其他疑问？<a href="#contact" className="text-primary hover:underline ml-1">随时联系我</a>
          </p>
        </div>
      </div>
    </section>
  )
}
