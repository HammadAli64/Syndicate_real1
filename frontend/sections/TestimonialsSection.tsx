'use client'

import { TestimonialsWithMarquee, type TestimonialItem } from '@/components/ui/testimonials-with-marquee'

const TESTIMONIALS: TestimonialItem[] = [
  {
    author: {
      name: 'Sarah Chen',
      handle: '@sarahchen',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    },
    text: "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for.",
    href: 'https://twitter.com/sarahchen',
  },
  {
    author: {
      name: 'Michael Rodriguez',
      handle: '@mikerod',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    text: "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable.",
    href: 'https://twitter.com/mikerod',
  },
  {
    author: {
      name: 'Emily Watson',
      handle: '@emilywatson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
    text: "This solution has significantly improved our team's productivity. The intuitive interface makes complex tasks simple.",
  },
  {
    author: {
      name: 'James Kim',
      handle: '@jameskim',
      avatar: 'https://images.unsplash.com/photo-1636041293178-808a6762ab39?w=150&h=150&fit=crop&crop=face',
    },
    text: "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
    href: 'https://twitter.com/jameskim',
  },
  {
    author: {
      name: 'Lisa Thompson',
      handle: '@lisathompson',
      avatar: 'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=150&h=150&fit=crop&crop=face',
    },
    text: 'The scalability and performance have been game-changing for our organization. Highly recommend to any growing business.',
  },
  {
    author: {
      name: 'David Park',
      handle: '@davidtech',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    text: 'The Syndicate delivers premium interfaces and strategic partnerships. A network of leaders who think bigger and move faster.',
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="testimonials-cyber-section relative overflow-visible px-4 py-16">
      <TestimonialsWithMarquee
        title="Trusted by leaders worldwide"
        description="Join the network of ambitious individuals building lasting impact with The Syndicate"
        testimonials={TESTIMONIALS}
        rows={2}
        className="!bg-transparent !px-0 !py-8 sm:!py-12 md:!py-16"
      />
    </section>
  )
}
