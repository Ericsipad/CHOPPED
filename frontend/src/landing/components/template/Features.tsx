import React from 'react'
import { Heart, Shield, Users, Search } from "lucide-react"

const features = [
  {
    icon: Heart,
    title: "Built for Real People",
    description: "We celebrate authenticity over perfection. No fake models, no impossible standards - just real people looking for genuine connections.",
    gradient: "from-primary to-primary-glow"
  },
  {
    icon: Shield,
    title: "Zero Tolerance for Fakes",
    description: "Every profile is verified. No AI bots, no catfish, no fake photos. What you see is what you get - real people, real stories.",
    gradient: "from-accent to-success"
  },
  {
    icon: Search,
    title: "Match Beyond the Surface",
    description: "Search by what really matters - medical conditions, lifestyle choices, values, and compatibility factors that dating apps ignore.",
    gradient: "from-secondary to-muted"
  },
  {
    icon: Users,
    title: "Inclusive Community",
    description: "A judgment-free zone where everyone belongs. Disabilities, chronic conditions, unique circumstances - all are welcome here.",
    gradient: "from-primary-glow to-accent"
  }
]

const Features: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold font-poppins text-foreground mb-6">
            Dating for <span className="bg-gradient-warm bg-clip-text text-transparent">the Rest of Us</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tired of perfect selfies and generic profiles? So are we. Chopped is where real people 
            find real love, without the pretense or judgment.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-warm text-center group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` as string }}
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              
              <h3 className="text-xl font-semibold font-poppins text-foreground mb-4">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features


