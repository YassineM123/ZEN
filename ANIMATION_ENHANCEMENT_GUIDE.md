# 🎬 Premium Cinematic Animation Implementation Guide

## Overview

Your website now has a complete **premium animation system** layered on top without breaking existing code. This guide shows you exactly how to integrate it.

---

## 📦 What's New

### 1. **Premium Scroll Animation Engine** (`lib/animation/premium-scroll.ts`)
- Scroll-driven animations with GSAP
- Parallax effects with depth
- Staggered element animations
- Smooth scroll momentum
- Text reveal effects
- Progress bar tracking

### 2. **Micro-Interactions System** (`lib/animation/micro-interactions.ts`)
- Magnetic button effects
- Custom cursor feedback
- Premium hover states
- Ripple effects
- 3D tilt effects
- Smooth counter animations

### 3. **Premium Hero Component** (`components/animations/premium-hero.tsx`)
- Kinetic typography (staggered word animation)
- Cinematic background parallax
- Enhanced CTA with magnetic behavior
- Completely wraps existing hero

### 4. **Section Transitions** (`lib/animation/section-transitions.ts`)
- Scroll-triggered reveals
- Blur-in effects
- Clip-path animations
- Intersection observer utilities
- Smooth scroll-to-section

---

## 🚀 Quick Start Integration

### Step 1: Wrap Your Hero Section

In `components/cinematic/hero-scene.tsx` or your hero component:

```tsx
// Before
export default function HeroScene() {
  return (
    <section className="hero">
      {/* existing content */}
    </section>
  )
}

// After
import PremiumHero from "@/components/animations/premium-hero"

export default function HeroScene() {
  return (
    <PremiumHero enableKineticText={true} enableParallax={true} enableMagneticCTA={true}>
      <section className="hero">
        {/* existing content - UNCHANGED */}
      </section>
    </PremiumHero>
  )
}
```

### Step 2: Add Scroll Animations to Sections

In any section component:

```tsx
import { PremiumSection } from "@/lib/animation/section-transitions"

export default function ServicesSection() {
  return (
    <PremiumSection
      className="py-16 sm:py-24"
      config={{
        enableReveal: true,
        enableStagger: true,
        staggerDelay: 0.12,
      }}
    >
      {/* Your existing services content */}
    </PremiumSection>
  )
}
```

### Step 3: Enhance Buttons with Magnetic Effect

```tsx
import { useMagneticButton } from "@/lib/animation/micro-interactions"

export function CTAButton() {
  const ref = useRef(null)
  useMagneticButton(ref, {
    strength: 0.35,
    returnSpeed: 0.12,
    radius: 120,
  })

  return (
    <button ref={ref} className="premium-cta">
      Planifier un appel
    </button>
  )
}
```

### Step 4: Enable Custom Cursor (Optional)

In your main layout (`app/layout.tsx`):

```tsx
import { initializeCursorFeedback } from "@/lib/animation/micro-interactions"

export default function RootLayout({ children }) {
  useEffect(() => {
    const cleanup = initializeCursorFeedback()
    return cleanup
  }, [])

  return (
    <html>
      {/* ... existing content ... */}
      {children}
    </html>
  )
}
```

---

## 📊 API Reference

### Premium Scroll Animations

#### `createRevealAnimation(element, options)`
Fade in + slide animation on scroll

```tsx
import { createRevealAnimation } from "@/lib/animation/premium-scroll"

useEffect(() => {
  const cardElement = document.querySelector(".card")
  if (cardElement) {
    createRevealAnimation(cardElement, {
      duration: 0.8,
      distance: 30,
      easing: "power3.out",
    })
  }
}, [])
```

#### `createParallaxLayer(element, options)`
Depth effect - background moves slower

```tsx
const cleanup = createParallaxLayer(backgroundElement, {
  speed: 0.5,      // Slower parallax
  direction: "up",
})
```

#### `createStaggerAnimation(container, options)`
Animate multiple children with stagger

```tsx
createStaggerAnimation(container, {
  selector: ".card",
  stagger: 0.1,    // 100ms between each
  duration: 0.6,
  distance: 20,
})
```

#### `createTextReveal(element, options)`
Character-by-character text animation

```tsx
createTextReveal(headingElement, {
  duration: 0.5,
  stagger: 0.02,   // 20ms per character
})
```

### Micro-Interactions

#### `useMagneticButton(ref, config)`
Hook for magnetic button effect

```tsx
const buttonRef = useRef(null)
useMagneticButton(buttonRef, {
  strength: 0.3,        // Attraction strength
  returnSpeed: 0.15,    // How fast it returns
  radius: 100,          // Activation radius (px)
})
```

#### `createPremiumHoverEffect(element)`
Enhanced hover with depth and glow

```tsx
useEffect(() => {
  const element = document.querySelector(".fancy-button")
  if (element) {
    createPremiumHoverEffect(element)
  }
}, [])
```

#### `initializeCursorFeedback()`
Global custom cursor system

```tsx
// In layout
useEffect(() => {
  const cleanup = initializeCursorFeedback()
  return cleanup
}, [])
```

#### `createTiltEffect(element, options)`
3D tilt on mouse move

```tsx
createTiltEffect(cardElement, {
  maxTilt: 5,     // Max rotation (degrees)
  scale: 1.02,    // Scale on hover
  speed: 0.1,     // Animation speed
})
```

#### `animateCounter(element, targetValue, options)`
Smooth number animation

```tsx
animateCounter(element, 2024, {
  duration: 2000,
  suffix: "+",
  format: (val) => val.toLocaleString(),
})
```

### Section Transitions

#### `<PremiumSection>`
Wrapper component with built-in scroll animations

```tsx
<PremiumSection
  className="py-20"
  config={{
    enableReveal: true,
    enableParallax: false,
    enableStagger: true,
    staggerDelay: 0.1,
    revealDistance: 30,
  }}
>
  {/* content */}
</PremiumSection>
```

#### `smoothScrollToSection(selector, offset)`
Smooth scroll with easing

```tsx
button.addEventListener("click", () => {
  smoothScrollToSection(".services", 80)
})
```

#### `createBlurReveal(element, options)`
Blur-in effect on scroll

```tsx
createBlurReveal(element, {
  duration: 0.8,
  blurAmount: 10,
  ease: "power2.out",
})
```

#### `createClipPathReveal(element, direction)`
Advanced masking animation

```tsx
createClipPathReveal(element, "bottom") // Can be: "left", "right", "top", "bottom"
```

---

## 🎨 Common Patterns

### Pattern 1: Enhanced Card Grid

```tsx
export function CardGrid({ cards }) {
  return (
    <PremiumSection config={{ enableStagger: true, staggerDelay: 0.15 }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} data-stagger>
            <Card>{card}</Card>
          </div>
        ))}
      </div>
    </PremiumSection>
  )
}
```

### Pattern 2: Magnetic CTA with Hover

```tsx
export function PremiumCTA() {
  const ref = useRef(null)

  useMagneticButton(ref, {
    strength: 0.35,
    returnSpeed: 0.12,
    radius: 120,
  })

  useEffect(() => {
    if (ref.current) {
      createPremiumHoverEffect(ref.current)
    }
  }, [])

  return (
    <button
      ref={ref}
      className="px-8 py-3 bg-accent rounded-lg font-medium"
    >
      Get Started
    </button>
  )
}
```

### Pattern 3: Section with Parallax

```tsx
export function ParallaxSection() {
  const bgRef = useRef(null)

  useEffect(() => {
    if (bgRef.current) {
      createParallaxLayer(bgRef.current, {
        speed: 0.4,
        direction: "up",
      })
    }
  }, [])

  return (
    <section className="relative overflow-hidden">
      <div ref={bgRef} className="absolute inset-0 -z-10">
        {/* Background */}
      </div>
      <div className="relative z-10">{/* Content */}</div>
    </section>
  )
}
```

### Pattern 4: Testimonials with Stagger

```tsx
export function Testimonials({ testimonials }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      createStaggerAnimation(containerRef.current, {
        selector: "[data-testimonial]",
        stagger: 0.2,
        duration: 0.6,
        distance: 25,
      })
    }
  }, [])

  return (
    <div ref={containerRef} className="space-y-6">
      {testimonials.map((t, i) => (
        <div key={i} data-testimonial>
          <TestimonialCard {...t} />
        </div>
      ))}
    </div>
  )
}
```

---

## ⚙️ Performance Optimization

### What's Already Optimized

✅ **GPU Acceleration**: All animations use `transform` and `opacity`  
✅ **60fps Target**: Uses `requestAnimationFrame`  
✅ **Reduced Motion Respect**: All animations check `prefers-reduced-motion`  
✅ **Off-screen Culling**: Animations only run when in viewport  
✅ **Memory Management**: Proper cleanup on unmount  

### Performance Best Practices

1. **Limit Stagger Animations**
   ```tsx
   // ✅ Good - 3-5 items max with stagger
   createStaggerAnimation(container, { stagger: 0.1 })

   // ❌ Avoid - Too many animated children
   ```

2. **Use Will-Change Sparingly**
   ```css
   /* Only on elements that actually animate */
   .animated-element {
     will-change: transform;
   }
   ```

3. **Debounce Scroll Events**
   ```tsx
   // Already done internally, but avoid adding extra scroll listeners
   ```

4. **Disable on Mobile if Needed**
   ```tsx
   const isMobile = window.innerWidth < 768
   
   useEffect(() => {
    if (isMobile) return
    // Heavy animations only on desktop
  }, [])
   ```

---

## 🔧 Troubleshooting

### "GSAP not available" Warning

This means GSAP failed to load. Check:

```tsx
// In lib/animation/gsap.ts - ensure it exports properly
export function getGsap() {
  // This will throw if gsap isn't installed
  return { gsap, ScrollTrigger }
}
```

**Fix**: Make sure `gsap` is installed:
```bash
npm install gsap
```

### Animations Not Playing

1. **Check prefers-reduced-motion**: Browser accessibility setting
2. **Verify elements exist**: Use `console.log()` to check DOM
3. **Check z-index conflicts**: Element might be hidden
4. **Clear browser cache**: Old code might be cached

### Performance Issues (Laggy Scroll)

1. **Reduce stagger count**: Use fewer animated elements
2. **Increase scrub value**: `scrub: 1` instead of `scrub: true`
3. **Disable parallax on mobile**: Conditional rendering
4. **Use `will-change` on GPU-intensive elements**:

```css
.parallax-bg {
  will-change: transform;
}
```

---

## 📱 Mobile Considerations

### Disable Heavy Animations on Mobile

```tsx
const isMobile = useMediaQuery("(max-width: 768px)")

useEffect(() => {
  if (isMobile) return // Skip animation setup

  // Heavy animations here
}, [isMobile])
```

### Use Simpler Effects

```tsx
// Mobile: Simple fade
// Desktop: Complex parallax + stagger

const effect = isMobile ? "fade" : "parallax"
```

---

## ✅ Implementation Checklist

- [ ] Install dependencies: `npm install gsap`
- [ ] Copy animation files to your project
- [ ] Wrap hero with `<PremiumHero>`
- [ ] Add `<PremiumSection>` to major sections
- [ ] Add magnetic buttons to CTAs
- [ ] Test on mobile and desktop
- [ ] Verify prefers-reduced-motion works
- [ ] Check performance with DevTools (60fps)
- [ ] Deploy and monitor

---

## 📊 Files Added/Modified

### New Files
- `lib/animation/premium-scroll.ts` - Scroll animation engine
- `lib/animation/micro-interactions.ts` - Button and cursor effects
- `lib/animation/section-transitions.ts` - Section scroll animations
- `components/animations/premium-hero.tsx` - Enhanced hero wrapper

### No Changes Required To
- Existing components
- Layout structure
- Content or text
- CMS integration
- API routes

---

## 🎯 Next Steps

1. **Start with Hero**: Wrap with `<PremiumHero>`
2. **Add Section Animations**: Wrap major sections
3. **Enhance CTAs**: Add magnetic buttons
4. **Test Performance**: Chrome DevTools → Performance tab
5. **Fine-tune Timings**: Adjust durations/delays to taste

---

## 📞 Support

For issues:
1. Check browser console for errors
2. Verify GSAP is installed: `npm ls gsap`
3. Test in incognito mode (no extensions)
4. Check prefers-reduced-motion setting
5. Review this guide's troubleshooting section

---

**Status**: ✅ Ready to integrate  
**Last Updated**: January 23, 2026  
**Performance Target**: 60fps on desktop, 30fps on mobile  
**Accessibility**: Full prefers-reduced-motion support
