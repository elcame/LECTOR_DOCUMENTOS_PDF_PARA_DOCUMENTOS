import { useEffect } from 'react'
import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/sections/HeroSection'
import BenefitsSection from '../components/landing/sections/BenefitsSection'
import HowItWorksSection from '../components/landing/sections/HowItWorksSection'
import FeaturesSection from '../components/landing/sections/FeaturesSection'
import TestimonialsSection from '../components/landing/sections/TestimonialsSection'
import CTASection from '../components/landing/sections/CTASection'
import Footer from '../components/landing/sections/Footer'

const Landing = () => {
  useEffect(() => {
    // Smooth scroll para anclas
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute('href'))
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      })
    })
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}

export default Landing
