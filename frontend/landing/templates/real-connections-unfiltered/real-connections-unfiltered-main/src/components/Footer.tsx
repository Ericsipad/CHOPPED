import { Heart, Mail, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-warm rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-poppins">Chopped Dating</h3>
                <p className="text-background/80 text-sm">Real dating for real people</p>
              </div>
            </div>
            
            <p className="text-background/80 mb-6 max-w-md leading-relaxed">
              We're building a dating platform where authenticity wins over perfection. 
              No fake models, no AI bots - just real people looking for genuine connections.
            </p>
            
            <div className="flex gap-4">
              <Button className="bg-background/10 hover:bg-background/20 text-background border-background/20">
                <Mail className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </div>
          </div>
          
          {/* Features */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Our Promise
            </h4>
            <ul className="space-y-3 text-background/80">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                100% real profiles
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                No AI or fake accounts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                Inclusive community
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                Medical condition friendly
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                Judgment-free zone
              </li>
            </ul>
          </div>
          
          {/* Legal & Safety */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety & Legal
            </h4>
            <ul className="space-y-3 text-background/80">
              <li>
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Community Guidelines</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Safety Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Report Abuse</a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-background/60 text-sm">
              © 2024 Chopped Dating. All rights reserved. Made with ❤️ for real people.
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-background/80">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
                <span>All systems operational</span>
              </div>
              <div className="text-background/60">
                chopped.dating
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;