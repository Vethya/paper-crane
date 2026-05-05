export type TagColor =
  | 'gray'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'

export const TAG_COLORS: TagColor[] = [
  'gray',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink'
]

// hex: dot/swatch color; bg/text: inline styles for badge background and text
export const tagColorMap: Record<
  TagColor,
  { hex: string; badgeBg: string; badgeText: string }
> = {
  gray: {
    hex: '#94a3b8',
    badgeBg: 'rgb(var(--tag-gray-bg))',
    badgeText: 'rgb(var(--tag-gray-text))'
  },
  red: {
    hex: '#f87171',
    badgeBg: 'rgb(var(--tag-red-bg))',
    badgeText: 'rgb(var(--tag-red-text))'
  },
  orange: {
    hex: '#fb923c',
    badgeBg: 'rgb(var(--tag-orange-bg))',
    badgeText: 'rgb(var(--tag-orange-text))'
  },
  yellow: {
    hex: '#facc15',
    badgeBg: 'rgb(var(--tag-yellow-bg))',
    badgeText: 'rgb(var(--tag-yellow-text))'
  },
  green: {
    hex: '#4ade80',
    badgeBg: 'rgb(var(--tag-green-bg))',
    badgeText: 'rgb(var(--tag-green-text))'
  },
  blue: {
    hex: '#60a5fa',
    badgeBg: 'rgb(var(--tag-blue-bg))',
    badgeText: 'rgb(var(--tag-blue-text))'
  },
  purple: {
    hex: '#c084fc',
    badgeBg: 'rgb(var(--tag-purple-bg))',
    badgeText: 'rgb(var(--tag-purple-text))'
  },
  pink: {
    hex: '#f472b6',
    badgeBg: 'rgb(var(--tag-pink-bg))',
    badgeText: 'rgb(var(--tag-pink-text))'
  }
}
