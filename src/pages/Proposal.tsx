const Proposal = () => {
  const handlePrint = () => window.print();

  return (
    <div className="bg-white text-gray-900 min-h-screen print:bg-white">
      {/* Print button - hidden when printing */}
      <div className="fixed top-4 right-4 print:hidden z-50">
        <button
          onClick={handlePrint}
          className="bg-pink-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-pink-700 transition-colors"
        >
          Save as PDF / Print
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 print:px-6 print:py-4">
        {/* Header */}
        <header className="text-center border-b-2 border-pink-500 pb-8 mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Website Development Proposal</h1>
          <p className="text-lg text-pink-600 font-semibold mb-1">Prepared for: Zidacakes'n'more</p>
          <p className="text-sm text-gray-500">
            Prepared by: PrimeStack Technologies &middot; {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-pink-600 mb-3">Project Overview</h2>
          <p className="text-gray-700 leading-relaxed">
            This proposal outlines the development of a fully functional, production-ready, premium e-commerce website for <strong>Zidacakes'n'more</strong>. The platform is designed to showcase your brand's elegance, enable seamless online ordering, and provide a complete digital experience for your customers — from browsing and customization to secure checkout and order management.
          </p>
        </section>

        {/* Tech Stack */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-pink-600 mb-3">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
            {[
              ["Frontend Framework", "React with TypeScript"],
              ["Styling", "Tailwind CSS (custom-themed)"],
              ["Animations", "Framer Motion & custom CSS"],
              ["Backend & Database", "Supabase (Zidacakes'n'more Cloud)"],
              ["Authentication", "Supabase Auth (email & password)"],
              ["Payments", "Stripe & PayPal integration"],
              ["Email Notifications", "EmailJS (customer) & Web3Forms (admin)"],
              ["State Management", "React Context API"],
              ["Architecture", "Modular, scalable component structure"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="font-semibold text-gray-900">{label}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        {[
          {
            title: "1. Modern Homepage",
            items: [
              "Animated hero section with floating accents and call-to-action buttons",
              "Featured product categories (Cakes, Pastries, Desserts) with hover animations",
              "Best sellers section with dynamic product cards",
              "\"Why Choose Us\" section with custom icons",
              "Testimonials slider and promotional call-to-action",
              "Fully responsive layout (mobile, tablet, desktop)",
            ],
          },
          {
            title: "2. Product Browsing & Filtering",
            items: [
              "Category-based filtering with real-time switching",
              "Sub-category support (Birthday Cakes, Wedding Cakes, Custom Cakes)",
              "Dynamic product rendering from the database",
              "Image previews and animated product cards",
              "Search bar with live filtering",
              "Pagination or load-more functionality",
            ],
          },
          {
            title: "3. Shopping Cart System",
            items: [
              "Add to cart, remove, and quantity adjustment",
              "Real-time price and total calculation",
              "Animated slide-out cart drawer",
              "Cart item counter badge in the navigation bar",
              "Persistent cart state across pages",
            ],
          },
          {
            title: "4. Cake Customization Page",
            items: [
              "Interactive cake builder with size, flavor, and filling selection",
              "Primary color picker for custom designs",
              "Delivery method selection and preferred date",
              "Special design notes for personalized requests",
              "Live order preview panel that updates dynamically",
              "Submission saved directly to the database",
            ],
          },
          {
            title: "5. Authentication System",
            items: [
              "Secure sign-up and sign-in with email verification",
              "Password reset functionality",
              "Protected routes (checkout, order history)",
              "Auto-redirect for unauthenticated users",
            ],
          },
          {
            title: "6. Checkout & Payment System",
            items: [
              "Delivery details form (name, phone, address, city)",
              "Date and time selection for delivery",
              "Special request field",
              "Order summary preview before payment",
              "Stripe payment integration (server-side verified)",
              "PayPal payment integration",
              "Animated success page after payment confirmation",
              "Secure webhook handling for payment verification",
            ],
          },
          {
            title: "7. Order Management",
            items: [
              "Customer dashboard to view past orders",
              "Order status tracking (Pending, Processing, Delivered)",
              "Order details modal with full breakdown",
            ],
          },
          {
            title: "8. Admin Dashboard",
            items: [
              "Role-based access control (admin vs. customer)",
              "Manage products (add, edit, delete)",
              "Manage and update order statuses",
              "Role validation through the database",
            ],
          },
          {
            title: "9. Email & Notification System",
            items: [
              "Automated customer confirmation email on successful order",
              "Admin notification with full order details sent to your email",
              "Payment status tracking and updates",
            ],
          },
          {
            title: "10. Responsive Navigation",
            items: [
              "Fixed navigation bar with logo, links, cart badge, and auth controls",
              "Mobile hamburger menu with animated slide-out panel",
              "Consistent header and footer across all pages",
              "Social media links and contact details in footer",
            ],
          },
          {
            title: "11. Professional About Us Page",
            items: [
              "Brand story, mission, vision, and core values",
              "Meet the team section with hover animations",
              "Call-to-action for new orders",
              "Rich, content-filled layout with premium design",
            ],
          },
          {
            title: "12. Contact Page",
            items: [
              "Contact form with animated inputs",
              "Business hours display",
              "Embedded map placeholder",
              "Social media icons and direct contact details",
            ],
          },
          {
            title: "13. Database Architecture",
            items: [
              "Products, categories, and sub-categories tables",
              "Orders and order items tables",
              "User profiles with role-based permissions",
              "Custom orders table for cake customizations",
              "Row-level security policies for data protection",
              "Real-time database updates",
            ],
          },
          {
            title: "14. Design & User Experience",
            items: [
              "Premium brand-consistent color palette (black, white, vibrant pink)",
              "Custom gradients, glow effects, and soft shadows",
              "Framer Motion page transitions and scroll-triggered reveals",
              "Micro-interactions on buttons, cards, and form elements",
              "Professional typography pairing",
              "Content-rich pages with no empty sections",
            ],
          },
          {
            title: "15. Security & Performance",
            items: [
              "Server-side payment verification (no frontend trust)",
              "Webhook signature validation",
              "API keys stored securely as environment secrets",
              "Row-level security on all database tables",
              "Input validation and sanitization",
              "Optimized for fast loading and mobile performance",
              "SEO-ready structure with proper meta tags",
            ],
          },
        ].map((section) => (
          <section key={section.title} className="mb-8 break-inside-avoid">
            <h2 className="text-xl font-bold text-pink-600 mb-2">{section.title}</h2>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 pl-2">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        {/* Closing */}
        <section className="mt-12 pt-8 border-t-2 border-pink-500 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Started?</h2>
          <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto mb-6">
            This website will position Zidacakes'n'more as a premium, trusted brand with a seamless digital experience. Every feature is designed to convert visitors into loyal customers and streamline your business operations.
          </p>
          <div className="text-sm text-gray-500">
            <p className="font-semibold text-gray-700">PrimeStack Technologies</p>
            <p>+234-903-148-4432</p>
            <p>Building smarter. Growing faster.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Proposal;
