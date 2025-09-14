import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

const comparisons = [
  {
    us: "Real photos, real stories",
    them: "Perfect selfies & fake lifestyles",
    highlight: true
  },
  {
    us: "Medical condition matching",
    them: "Surface-level swiping only",
    highlight: false
  },
  {
    us: "Verified human profiles",
    them: "AI bots & fake accounts",
    highlight: true
  },
  {
    us: "Inclusive of all abilities",
    them: "Exclusionary beauty standards",
    highlight: false
  },
  {
    us: "Honest about challenges",
    them: "Hiding real personality",
    highlight: true
  }
];

const Authenticity = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-bold font-poppins text-foreground mb-6">
              Why <span className="bg-gradient-warm bg-clip-text text-transparent">Chopped</span> is Different
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're tired of dating apps that prioritize looks over personality, 
              perfection over authenticity. Here's how we're changing the game.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Comparison Table */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-soft">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-warm rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-primary">Chopped Dating</h3>
                  </div>
                  <div className="text-muted-foreground text-2xl font-light">vs.</div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                      <X className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-muted-foreground">Other Apps</h3>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {comparisons.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                        item.highlight ? 'bg-primary/5 border border-primary/20' : 'bg-muted/10'
                      }`}
                    >
                      <div className="flex-1 text-sm text-foreground font-medium">
                        {item.us}
                      </div>
                      <div className="w-px h-8 bg-border mx-4" />
                      <div className="flex-1 text-sm text-muted-foreground text-right">
                        {item.them}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="bg-gradient-warm rounded-3xl p-8 text-white shadow-warm">
                <h3 className="text-3xl font-bold font-poppins mb-6">
                  Ready for Real Dating?
                </h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white/90" />
                    <span>No fake profiles or bots</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white/90" />
                    <span>Match on real compatibility</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white/90" />
                    <span>Inclusive of all backgrounds</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white/90" />
                    <span>Safe space for everyone</span>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-white text-primary hover:bg-white/90 text-lg py-4 font-semibold shadow-none hover:shadow-glow transition-all duration-300"
                >
                  Join Chopped Dating Free
                </Button>
                
                <p className="text-center text-white/80 text-sm mt-4">
                  Join thousands of real people finding real love
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Authenticity;