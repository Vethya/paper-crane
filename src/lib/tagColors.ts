export type TagColor = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'

export const TAG_COLORS: TagColor[] = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']

// hex: dot/swatch color; bg/text: inline styles for badge background and text
export const tagColorMap: Record<TagColor, { hex: string; badgeBg: string; badgeText: string }> = {
  gray:   { hex: '#94a3b8', badgeBg: 'rgba(100,116,139,0.35)', badgeText: '#cbd5e1' },
  red:    { hex: '#f87171', badgeBg: 'rgba(127,29,29,0.5)',    badgeText: '#fca5a5' },
  orange: { hex: '#fb923c', badgeBg: 'rgba(124,45,18,0.5)',    badgeText: '#fdba74' },
  yellow: { hex: '#facc15', badgeBg: 'rgba(113,63,18,0.5)',    badgeText: '#fde047' },
  green:  { hex: '#4ade80', badgeBg: 'rgba(20,83,45,0.5)',     badgeText: '#86efac' },
  blue:   { hex: '#60a5fa', badgeBg: 'rgba(30,58,138,0.5)',    badgeText: '#93c5fd' },
  purple: { hex: '#c084fc', badgeBg: 'rgba(88,28,135,0.5)',    badgeText: '#d8b4fe' },
  pink:   { hex: '#f472b6', badgeBg: 'rgba(131,24,67,0.5)',    badgeText: '#f9a8d4' },
}
