import { type Variants } from 'framer-motion'

export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
}

export const slideFromBottom: Variants = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { y: 50, opacity: 0, transition: { duration: 0.3 } },
}

export const slideFromTop: Variants = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.25 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.25 } },
}

export const slideFromLeft: Variants = {
  initial: { x: '100vw' , opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 1 } },
  exit: { x: '-100vw', opacity: 0, transition: { duration: 1 } },
}

export const slideFromLeftSlow: Variants = {
  initial: { x: '100vw', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 1.5 } },
  exit: { x: -50, opacity: 0, transition: { duration: 1.5 } },
}

export const slideFromRight: Variants = {
  initial: { x: '-100vw', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 1 } },
  exit: { x: '100vw', opacity: 0, transition: { duration: 1 } },
}

export const slideFromRightSlow: Variants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.5 } },
  exit: { x: 50, opacity: 0, transition: { duration: 0.5 } },
}

export const scaleIn: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.2 } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
}

export const hoverGrow = {
  whileHover: { scale: 1.05 },
  transition: { type: 'spring', stiffness: 300 }
} as const;

export const tapShrink = {
  whileTap: { scale: 0.95 }
}

export const spin = {
  animate: { rotate: 360 },
  transition: { repeat: Infinity, duration: 2, ease: "linear" }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
}

export const deluxeFadeIn = {
  initial: { opacity: 0, y: 30, rotate: -2 },
  animate: { opacity: 1, y: 0, rotate: 0 },
  exit: { opacity: 0, y: 30 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
}
