import type { Event, EventCategory, PosterSpec } from '@/types/event'
import { VENUE_BY_ID } from './venues'
import { dayAt, daysFromNow } from './clock'

interface EventSeed {
  id: string
  title: string
  tagline: string
  category: EventCategory
  venueId: string
  /** Days from today. Negative renders a past event. */
  dayOffset: number
  hour: number
  minute?: number
  durationMinutes: number
  description: string
  highlights: string[]
  poster: PosterSpec
  /** 0–1 fraction of inventory already sold. Drives "selling fast" badges. */
  soldRatio: number
  requiresWaitingRoom?: boolean
}

const SEEDS: EventSeed[] = [
  {
    id: 'evt-qubit-workshop',
    title: 'Qubit Workshop Series: Distributed Systems in Practice',
    tagline: 'Hands-on session on consensus, queues and distributed locking',
    category: 'CONFERENCE',
    venueId: 'ven-kendra',
    dayOffset: 1,
    hour: 10,
    durationMinutes: 480,
    soldRatio: 0.93,
    requiresWaitingRoom: true,
    poster: { hue: 212, accentHue: 38, motif: 'grid', code: 'QB' },
    description:
      'An intensive one-day workshop where participants implement Raft-style leader election, a Redis-backed distributed lock, and a token bucket rate limiter. Every exercise runs against a live multi-node cluster.',
    highlights: [
      'Re-implement optimistic concurrency control with version counters',
      'Benchmark 1,000 concurrent writers against a single hot key',
      'Instrument p95 and p99 latency with k6 in the room',
    ],
  },
  {
    id: 'evt-ironline-fc',
    title: 'Ironline FC vs Coastal United',
    tagline: 'North Zone League · Matchday 21',
    category: 'SPORTS',
    venueId: 'ven-rajpath',
    dayOffset: 2,
    hour: 16,
    minute: 30,
    durationMinutes: 130,
    soldRatio: 0.71,
    poster: { hue: 148, accentHue: 200, motif: 'chevron', code: 'IL' },
    description:
      'The decisive fixture of the North Zone league phase. Ironline need a point to keep their seeding; Coastal United arrive unbeaten in four. Expect a sold-out North Terrace.',
    highlights: [
      'Doors open 90 minutes before kick-off',
      'Fan zone with live statistics on the south concourse',
      'Accessible viewing platforms in the East Stand',
    ],
  },
  {
    id: 'evt-mahabharat',
    title: 'Mahabharat — The Ballet',
    tagline: 'A classical retelling in modern choreography',
    category: 'THEATRE',
    venueId: 'ven-kendra',
    dayOffset: 3,
    hour: 19,
    durationMinutes: 165,
    soldRatio: 0.58,
    poster: { hue: 24, accentHue: 340, motif: 'arc', code: 'MB' },
    description:
      'Ninety performers, one rotating stage, and a score performed live. The production compresses the Kurukshetra arc into a single evening without losing a single turning point.',
    highlights: [
      'Pre-show percussion on the terrace from 18:15',
      'Live surtitles in English and Hindi',
      'Running time 2h 45m including interval',
    ],
  },
  {
    id: 'evt-midnight-meridian',
    title: 'Midnight Meridian',
    tagline: 'The full-bleed arena show returns to Mumbai',
    category: 'CONCERT',
    venueId: 'ven-meridian',
    dayOffset: 5,
    hour: 20,
    durationMinutes: 150,
    soldRatio: 0.88,
    requiresWaitingRoom: true,
    poster: { hue: 268, accentHue: 42, motif: 'wave', code: 'MM' },
    description:
      'A 360-degree production built for the Skyline Pavilion, with a lighting rig designed specifically for the Bandra Reclamation roofline. Expect the arena floor to be released as a standing pit for the final two songs.',
    highlights: [
      'Skyline Pavilion opens 60 minutes early with canapés',
      'Standing pit allocation on the evening of the show',
      'Silent-disco encore from 23:15',
    ],
  },
  {
    id: 'evt-unfiltered',
    title: 'Unfiltered: Live with A. Koirala',
    tagline: 'An hour of unscripted stage work',
    category: 'COMEDY',
    venueId: 'ven-palladium',
    dayOffset: 7,
    hour: 20,
    minute: 15,
    durationMinutes: 95,
    soldRatio: 0.64,
    poster: { hue: 44, accentHue: 8, motif: 'orbit', code: 'UF' },
    description:
      'No set list, no safety net. A. Koirala performs a full hour of new material in front of a 400-strong audience, followed by a 20-minute audience Q&A.',
    highlights: [
      'Strict 95-minute runtime, no encore',
      'Audience Q&A on stage after the set',
      'Age advisory 16+',
    ],
  },
  {
    id: 'evt-sysforge',
    title: 'SysForge 2026 — Distributed Systems Summit',
    tagline: 'Two tracks, twelve speakers, one hard problem',
    category: 'CONFERENCE',
    venueId: 'ven-dome',
    dayOffset: 9,
    hour: 9,
    minute: 30,
    durationMinutes: 540,
    soldRatio: 0.81,
    poster: { hue: 194, accentHue: 168, motif: 'grid', code: 'SF' },
    description:
      'A single-track day on the unglamorous parts of scaling: lock contention, cache invalidation, queue backpressure and the operational cost of every one of them. Designed for engineers who already run production traffic.',
    highlights: [
      'Track A: concurrency and consistency',
      'Track B: streaming, queues and observability',
      'Workshop wing opens for hands-on labs',
    ],
  },
  {
    id: 'evt-fenrir-cup',
    title: 'Fenrir Cup Semi-Final',
    tagline: 'Knockout football · Under-21',
    category: 'SPORTS',
    venueId: 'ven-rajpath',
    dayOffset: 11,
    hour: 18,
    durationMinutes: 120,
    soldRatio: 0.42,
    poster: { hue: 96, accentHue: 0, motif: 'chevron', code: 'FC' },
    description:
      'The last gate before the Fenrir Cup final. Winners progress to the national round at the Skyline Dome; the fixture is scheduled with a 15-minute interval at half time.',
    highlights: [
      'Gates open at 16:45 with fan-zone activations',
      'Match balls and scarves supplied with every ticket',
      'Under-14 accompanied entry permitted free of charge',
    ],
  },
  {
    id: 'evt-neon-signal',
    title: 'Neon Signal: Live',
    tagline: 'Synth-led, two drummers, no support act',
    category: 'CONCERT',
    venueId: 'ven-palladium',
    dayOffset: 12,
    hour: 19,
    minute: 45,
    durationMinutes: 135,
    soldRatio: 0.76,
    poster: { hue: 186, accentHue: 320, motif: 'wave', code: 'NS' },
    description:
      'The band brings the full modular rig for a single Delhi date. The Loge is configured for an unobstructed sightline to the stage riser.',
    highlights: [
      'Doors 18:30, curfew strictly enforced',
      'Loge tier includes a programme and lanyard',
      'No re-entry after 21:00',
    ],
  },
  {
    id: 'evt-silverline',
    title: 'Silverline Chamber Recital',
    tagline: 'Strings for eight, hall for two hundred',
    category: 'THEATRE',
    venueId: 'ven-kendra',
    dayOffset: 15,
    hour: 18,
    minute: 30,
    durationMinutes: 110,
    soldRatio: 0.37,
    poster: { hue: 38, accentHue: 210, motif: 'arc', code: 'SL' },
    description:
      'An intimate programme of string quartets performed with the hall lights at working level. Latecomers are seated only during applause.',
    highlights: [
      'Unamplified performance — hall capacity is strict',
      'Programme notes mailed to all confirmed guests',
      'Complimentary interval refreshments',
    ],
  },
  {
    id: 'evt-atlas-invitational',
    title: 'Atlas Invitational: Grand Final',
    tagline: 'Season finale, best of five',
    category: 'SPORTS',
    venueId: 'ven-dome',
    dayOffset: 19,
    hour: 19,
    durationMinutes: 240,
    soldRatio: 0.55,
    poster: { hue: 232, accentHue: 168, motif: 'orbit', code: 'AI' },
    description:
      'The Invitational reaches its conclusion with a best-of-five final and a trophy presentation on the main floor. Pavilion boxes include post-match reception access.',
    highlights: [
      'Trophy presentation and photo call',
      'Pavilion box guests invited to the reception',
      'Broadcast commentary from the sound desk',
    ],
  },
  {
    id: 'evt-lantern-nights',
    title: 'Lantern Nights — Marathi Stage',
    tagline: 'Comedy in the round',
    category: 'THEATRE',
    venueId: 'ven-meridian',
    dayOffset: 22,
    hour: 20,
    minute: 30,
    durationMinutes: 140,
    soldRatio: 0.48,
    poster: { hue: 8, accentHue: 42, motif: 'orbit', code: 'LN' },
    description:
      'Six performers, one rotating stage, and a script that changes every night. The Balcony Tier is converted to a raked configuration for the run.',
    highlights: [
      'Rotating stage configuration changes nightly',
      'Late show at 23:00 on Saturdays',
      'Interval includes Maharashtrian snacks',
    ],
  },
  {
    id: 'evt-vector-summit',
    title: 'Vector Annual Summit',
    tagline: 'Platform engineering, at scale',
    category: 'CONFERENCE',
    venueId: 'ven-palladium',
    dayOffset: 26,
    hour: 9,
    minute: 15,
    durationMinutes: 570,
    soldRatio: 0.69,
    poster: { hue: 174, accentHue: 260, motif: 'grid', code: 'VS' },
    description:
      'Vector returns for its flagship summit: internal platforms, developer experience, and the organisational cost of platform teams that nobody budgets for.',
    highlights: [
      'Fire-side sessions across four rooms',
      'Closed-door engineering leadership track',
      'Full proceedings published to attendees',
    ],
  },
  {
    id: 'evt-hyperloop',
    title: 'Hyperloop Festival',
    tagline: 'Two stages, eighteen hours, forty artists',
    category: 'CONCERT',
    venueId: 'ven-lakeside',
    dayOffset: 33,
    hour: 15,
    durationMinutes: 600,
    soldRatio: 0.91,
    requiresWaitingRoom: true,
    poster: { hue: 300, accentHue: 30, motif: 'wave', code: 'HL' },
    description:
      'The lakeside fields open at 15:00 with the acoustic stage first, escalating to the main stage from 21:00. Lawn allocation is strictly by zone and tier.',
    highlights: [
      'Acoustic stage from 15:00, main stage from 21:00',
      'Zone re-entry permitted once per guest',
      'Shuttle services from Sector 18 metro every 30 minutes',
    ],
  },
  {
    id: 'evt-circadian',
    title: 'Circadian: Live in Noida',
    tagline: 'The one-night-only Noida date',
    category: 'CONCERT',
    venueId: 'ven-lakeside',
    dayOffset: 46,
    hour: 18,
    minute: 30,
    durationMinutes: 170,
    soldRatio: 0.29,
    poster: { hue: 262, accentHue: 190, motif: 'arc', code: 'CD' },
    description:
      'A single Noida date for a tour that has played four continents. Early allocation means the best sightlines in Lawn A are still available.',
    highlights: [
      'Onsite parking limited — shuttle strongly advised',
      'Lawn C opens for general admission from 19:00',
      'Final song at approximately 21:20',
    ],
  },
  {
    id: 'evt-colloquium',
    title: 'Systems Colloquium 2025',
    tagline: 'Recorded session · proceedings available',
    category: 'CONFERENCE',
    venueId: 'ven-dome',
    dayOffset: -21,
    hour: 10,
    durationMinutes: 480,
    soldRatio: 1,
    poster: { hue: 206, accentHue: 44, motif: 'grid', code: 'SC' },
    description:
      'The 2025 edition of the colloquium, retained in the catalogue so past bookings and refunds remain verifiable.',
    highlights: [
      'Proceedings released to all confirmed attendees',
      'Session recordings remain available for 90 days',
      'Next edition scheduled for 2026',
    ],
  },
]

function buildPricingTiers(seed: EventSeed) {
  const venue = VENUE_BY_ID.get(seed.venueId)
  if (!venue) return []

  const tiers = new Map<string, { tierName: string; price: number; sortOrder: number }>()
  venue.sections.forEach((section, index) => {
    const existing = tiers.get(section.tierName)
    if (!existing || section.price > existing.price) {
      tiers.set(section.tierName, {
        tierName: section.tierName,
        price: section.price,
        sortOrder: index,
      })
    }
  })

  const perks: Record<string, string> = {
    Platinum: 'Front-most sightline, lounge access, priority entry',
    Champagne: 'Lower stalls, dedicated entry lane, programme included',
    Gold: 'Mid-tier seating with clear stage line',
    Silver: 'Upper-tier seating, standard entry',
  }

  return [...tiers.values()]
    .sort((a, b) => b.price - a.price)
    .map((tier, index) => ({
      tierName: tier.tierName,
      price: tier.price,
      currency: 'INR',
      perk: perks[tier.tierName] ?? 'Standard allocation',
      sortOrder: index,
    }))
}

/** Full event catalogue, resolved against the venue collection. */
export const EVENTS: Event[] = SEEDS.map((seed) => {
  const venue = VENUE_BY_ID.get(seed.venueId)
  if (!venue) {
    throw new Error(`Mock dataset integrity error: unknown venue "${seed.venueId}"`)
  }

  const start = dayAt(seed.dayOffset, seed.hour, seed.minute ?? 30)
  const end = new Date(new Date(start).getTime() + seed.durationMinutes * 60_000).toISOString()
  const pricingTiers = buildPricingTiers(seed)
  const prices = pricingTiers.map((tier) => tier.price)

  return {
    id: seed.id,
    title: seed.title,
    tagline: seed.tagline,
    description: seed.description,
    highlights: seed.highlights,
    category: seed.category,
    status: 'OPEN' as const,
    venue,
    startTime: start,
    endTime: end,
    salesOpenAt: daysFromNow(-30),
    salesCloseAt: start,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    currency: 'INR',
    totalSeats: venue.capacity,
    // Placeholder values; the mock store recomputes these from the seat map.
    availableSeats: venue.capacity,
    soldPercentage: Math.round(seed.soldRatio * 100),
    isSellingFast: seed.soldRatio >= 0.85,
    requiresWaitingRoom: seed.requiresWaitingRoom ?? false,
    poster: seed.poster,
    pricingTiers,
    createdAt: daysFromNow(-60),
  }
})

export const EVENT_BY_ID = new Map(EVENTS.map((event) => [event.id, event]))

/** Exposure ratio used by the seat generator for this event. */
export function soldRatioFor(eventId: string): number {
  return EVENTS.find((event) => event.id === eventId)?.soldPercentage
    ? EVENTS.find((event) => event.id === eventId)!.soldPercentage / 100
    : 0.5
}