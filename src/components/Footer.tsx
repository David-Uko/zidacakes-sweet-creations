import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">
              Zida<span className="text-primary">cakes</span>'n'more
            </h3>
            <p className="text-surface-dark-foreground/60 font-body text-sm leading-relaxed mb-6">
              Deliciously crafted, beautifully designed. Premium cakes and desserts for every occasion.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-surface-dark-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { to: "/shop", label: "Shop All" },
                { to: "/customize", label: "Custom Cakes" },
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact" },
              ].map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-surface-dark-foreground/60 hover:text-primary transition-colors text-sm font-body"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-surface-dark-foreground/60">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                123 Bakery Lane, Sweet City
              </li>
              <li className="flex items-center gap-3 text-sm text-surface-dark-foreground/60">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                +44 7746 791484
              </li>
              <li className="flex items-center gap-3 text-sm text-surface-dark-foreground/60">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                zidacakes@gmail.com
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Business Hours</h4>
            <ul className="space-y-2 text-sm text-surface-dark-foreground/60">
              <li className="flex justify-between"><span>Mon - Fri</span><span>8:00 AM - 8:00 PM</span></li>
              <li className="flex justify-between"><span>Saturday</span><span>9:00 AM - 9:00 PM</span></li>
              <li className="flex justify-between"><span>Sunday</span><span>10:00 AM - 6:00 PM</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-dark-foreground/10 mt-12 pt-8 text-center">
          <p className="text-sm text-surface-dark-foreground/40 font-body">
            © 2026 Zidacakes'n'more. All rights reserved. Made with 🩷
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
