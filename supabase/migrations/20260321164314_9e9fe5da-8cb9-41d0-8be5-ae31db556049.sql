
-- Courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  duration text,
  image_url text,
  category text NOT NULL DEFAULT 'course',
  learning_points jsonb DEFAULT '[]'::jsonb,
  is_mentorship boolean NOT NULL DEFAULT false,
  telegram_link text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course lessons table
CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  video_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User course purchases table
CREATE TABLE public.user_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  payment_status text NOT NULL DEFAULT 'unpaid',
  stripe_session_id text,
  paypal_order_id text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- Courses: anyone can read published courses
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (published = true);

-- Admins can manage courses
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Course lessons: only purchasers can view
CREATE POLICY "Purchasers can view lessons" ON public.course_lessons
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_courses
      WHERE user_courses.course_id = course_lessons.course_id
        AND user_courses.user_id = auth.uid()
        AND user_courses.payment_status = 'paid'
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Admins can manage lessons
CREATE POLICY "Admins can manage lessons" ON public.course_lessons
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User courses policies
CREATE POLICY "Users can view own purchases" ON public.user_courses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases" ON public.user_courses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can update purchases" ON public.user_courses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Seed courses data
INSERT INTO public.courses (title, description, price, duration, category, is_mentorship, learning_points, image_url) VALUES
(
  'Cake Making Fundamentals',
  'Master the art of baking beautiful cakes from scratch. This comprehensive course covers everything from basic sponge cakes to layered masterpieces.',
  149.99,
  '6 weeks',
  'baking',
  false,
  '["Baking perfect sponge cakes", "Mastering buttercream and ganache", "Levelling and layering techniques", "Essential decorating tools", "Flavour pairing principles"]'::jsonb,
  NULL
),
(
  'Pastry Making Masterclass',
  'Dive deep into the world of pastries. Learn to create croissants, puff pastry, choux, tarts, and more with professional techniques.',
  179.99,
  '8 weeks',
  'pastry',
  false,
  '["Laminated dough techniques", "Choux pastry and éclairs", "Tart shells and fillings", "Puff pastry from scratch", "Professional finishing touches"]'::jsonb,
  NULL
),
(
  'Advanced Cake Design',
  'Take your cake decorating to the next level with advanced fondant work, sugar flowers, airbrushing, and modern cake art techniques.',
  249.99,
  '10 weeks',
  'design',
  false,
  '["Fondant sculpting and modelling", "Handcrafted sugar flowers", "Airbrushing techniques", "Gravity-defying structures", "Wedding cake design"]'::jsonb,
  NULL
),
(
  'Cookie & Cupcake Artistry',
  'Learn to create stunning decorated cookies and cupcakes that look almost too good to eat. Perfect for starting a side business.',
  99.99,
  '4 weeks',
  'baking',
  false,
  '["Royal icing cookie art", "Cupcake piping techniques", "Fondant toppers", "Packaging and presentation", "Pricing for profit"]'::jsonb,
  NULL
),
(
  'Private Mentorship Programme',
  'Get personalised one-on-one mentorship with our expert bakers. Includes weekly video calls, personalised feedback, and exclusive access to our private Telegram community.',
  499.99,
  '3 months',
  'mentorship',
  true,
  '["Weekly 1-on-1 video sessions", "Personalised feedback on your work", "Private Telegram community access", "Business guidance and branding", "Lifetime access to recordings"]'::jsonb,
  NULL
);

-- Seed some lessons for each course
INSERT INTO public.course_lessons (course_id, title, content, sort_order)
SELECT c.id, l.title, l.content, l.sort_order
FROM public.courses c,
LATERAL (VALUES
  ('Introduction & Welcome', 'Welcome to the course! In this lesson we cover the course structure, what you will learn, and how to get the most out of your training.', 1),
  ('Essential Tools & Ingredients', 'A comprehensive guide to the tools and ingredients you will need throughout this course.', 2),
  ('Your First Practical Lesson', 'Let''s get started with hands-on practice. Follow along step by step.', 3)
) AS l(title, content, sort_order)
WHERE c.is_mentorship = false;

-- Add mentorship lesson
INSERT INTO public.course_lessons (course_id, title, content, sort_order)
SELECT c.id, 'Welcome to Mentorship', 'Congratulations on joining the Private Mentorship Programme! Below you will find your Telegram group link and schedule for your first session.', 1
FROM public.courses c WHERE c.is_mentorship = true;

-- Function to check course access
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_courses
    WHERE user_id = _user_id
      AND course_id = _course_id
      AND payment_status = 'paid'
  )
$$;
