import React from 'react'
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Sarah M.",
    age: 29,
    condition: "Type 1 Diabetes",
    text: "Finally, a dating app where I don't have to hide my insulin pump or worry about judgment. I met my partner here who understands my daily routine completely.",
    rating: 5,
    verified: true
  },
  {
    name: "Marcus T.",
    age: 34,
    condition: "Anxiety & Depression",
    text: "Other apps made me feel like I had to be perfect. Chopped let me be honest about my mental health journey from day one. No more hiding who I really am.",
    rating: 5,
    verified: true
  },
  {
    name: "Elena R.",
    age: 26,
    condition: "Chronic Fatigue",
    text: "I was tired of explaining why I couldn't do dinner dates every night. Here, people get it. I found someone who plans dates around my energy levels.",
    rating: 5,
    verified: true
  }
]

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold font-poppins text-foreground mb-6">
            Real Stories from <span className="bg-gradient-warm bg-clip-text text-transparent">Real People</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            These aren't stock photos or made-up testimonials. These are actual Chopped members 
            who found love by being authentically themselves.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="card-warm text-left animate-fade-in-up"
              style={{ animationDelay: `${index * 0.2}s` as string }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Quote className="w-8 h-8 text-primary" />
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              
              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Age {testimonial.age} • {testimonial.condition}
                    </p>
                  </div>
                  {testimonial.verified && (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="inline-flex items-center gap-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-6 py-3 shadow-soft">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-gradient-warm rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground">10,000+ members</span>
              <span className="text-muted-foreground"> found meaningful connections</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials



