import React from 'react'
import { Button } from "../ui/button"
import heroImage from "../../assets/hero-image.png"

export type HeroProps = {
  onClickSignUp?: () => void
  onClickSignIn?: () => void
}

const Hero: React.FC<HeroProps> = ({ onClickSignUp, onClickSignIn }) => {
  return (
    <section 
      className="h-screen xl:h-[120vh] flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3)), url(${heroImage})`
      }}
    >
      <div className="container mx-auto px-4 py-20 mt-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl lg:text-8xl font-bold font-poppins mb-6 leading-tight">
              <span className="text-white text-shadow-warm">
                Chopped
              </span>
              <br />
              <span className="bg-gradient-warm bg-clip-text text-transparent text-shadow-warm">
                Dating
              </span>
            </h1>
            
            <p className="text-xl lg:text-3xl text-white/90 mb-8 max-w-3xl mx-auto font-medium">
              Real dating for <span className="text-primary-glow font-bold">real people</span>. 
              <br className="hidden sm:block" />
              No fake models, no AI bots - just authentic connections built for "the rest of us."
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="btn-hero text-xl px-12 py-6 shadow-glow" onClick={onClickSignUp}>
                Sign Up Free
              </Button>
              <Button variant="outline" size="lg" className="btn-hero-outline text-xl px-12 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-foreground" onClick={onClickSignIn}>
                Sign In
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse-soft" />
                <span className="font-medium">100% Real Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-glow rounded-full animate-pulse-soft" />
                <span className="font-medium">No Judgment Zone</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-20 right-10 bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-soft animate-float hidden lg:block">
          <div className="text-2xl font-bold text-primary">10K+</div>
          <div className="text-sm text-muted-foreground">Real Members</div>
        </div>
        
        <div className="absolute bottom-20 left-10 bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-soft animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
          <div className="text-2xl font-bold text-accent">Zero</div>
          <div className="text-sm text-muted-foreground">Fake Profiles</div>
        </div>
      </div>
    </section>
  )
}

export default Hero


