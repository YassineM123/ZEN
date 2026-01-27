# Animation System

## Structure
- Scenes live in `components/cinematic/*-scene.tsx`.
- Each scene is a client component with a GSAP ScrollTrigger timeline.
- Shared hooks live in `lib/animation/*`.

## Conventions
- Use `useScrollScene(ref, setup)` for every scene.
- ScrollTrigger timelines should use `scrub` (no instant jumps).
- Pinned hero, case studies, and offer sections use `pin: true`.
- Use `data-*` selectors for animated nodes (ex: `data-hero-word`, `data-card`).
- Avoid mixing GSAP and Framer Motion on the same element (wrap with a child).
- Keep motion on `transform` and `opacity`; avoid layout-affecting props.

## Breakpoints
- Desktop: `min-width: 960px` uses full pin + depth.
- Mobile: `max-width: 959px` uses simplified timelines (no heavy 3D).
- `prefers-reduced-motion` disables timelines entirely.

## Performance Rules
- GPU-friendly transforms only (`translate`, `scale`, `rotate`).
- Use `will-change` on heavy transform targets.
- Avoid large, animated filters or box-shadows.
- Offscreen effects rely on ScrollTrigger; no global rAF loops.

## Usage Pattern
```
const ref = useRef(null)
useScrollScene(ref, ({ root, gsap, mm }) => {
  mm.add("(min-width: 960px)", () => {
    gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "+=120%",
        scrub: 1.2,
        pin: true,
      },
    })
  })
})
```
