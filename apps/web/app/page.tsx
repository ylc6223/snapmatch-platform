import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { PortfolioGallery } from "@/components/portfolio-gallery"
import { CaseStudies } from "@/components/case-studies"
import { Services } from "@/components/services"
import { About } from "@/components/about"
import { Contact } from "@/components/contact"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import { BackToTop } from "@/components/back-to-top"

export default function HomePage() {
  return (
    <main className="min-h-screen m-0 p-0">
      <Header />
      <Hero />
      <Services />
      <PortfolioGallery />
      <CaseStudies />
      <About />
      <FAQ />
      <Contact />
      <Footer />
      <BackToTop />
    </main>
  )
}
