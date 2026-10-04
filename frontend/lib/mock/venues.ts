import type { Venue } from '@/types/event'
import { daysFromNow } from './clock'

/**
 * Venue catalogue.
 *
 * Seat counts are intentionally in the 300–900 range: large enough for a
 * believable arena map, small enough that the interactive seat grid stays
 * responsive on a mid-range mobile device.
 */

export const VENUES: Venue[] = [
  {
    id: 'ven-meridian',
    name: 'Meridian Arena',
    address: 'Plot 14, Bandra Reclamation, Bandra East',
    locality: 'Bandra East',
    city: 'Mumbai',
    capacity: 326,
    createdAt: daysFromNow(-420),
    sections: [
      {
        code: 'VP',
        name: 'Skyline Pavilion',
        rows: ['V', 'W'],
        seatsPerRow: 8,
        tierName: 'Platinum',
        price: 12500,
        accessibleSeats: [{ row: 'W', seatNumber: 1 }, { row: 'W', seatNumber: 8 }],
      },
      {
        code: 'A',
        name: 'Front Stalls',
        rows: ['A', 'B', 'C', 'D'],
        seatsPerRow: 16,
        tierName: 'Champagne',
        price: 7400,
        accessibleSeats: [
          { row: 'A', seatNumber: 1 },
          { row: 'A', seatNumber: 16 },
        ],
      },
      {
        code: 'B',
        name: 'Stalls',
        rows: ['E', 'F', 'G', 'H', 'I', 'J', 'K'],
        seatsPerRow: 18,
        tierName: 'Gold',
        price: 4600,
      },
      {
        code: 'C',
        name: 'Balcony Tier',
        rows: ['L', 'M', 'N', 'O', 'P', 'Q'],
        seatsPerRow: 20,
        tierName: 'Silver',
        price: 2450,
      },
    ],
  },
  {
    id: 'ven-palladium',
    name: 'The Grand Palladium',
    address: 'Block B, Connaught Place',
    locality: 'Connaught Place',
    city: 'New Delhi',
    capacity: 406,
    createdAt: daysFromNow(-380),
    sections: [
      {
        code: 'VP',
        name: 'Dome Front',
        rows: ['V', 'W'],
        seatsPerRow: 10,
        tierName: 'Platinum',
        price: 14800,
      },
      {
        code: 'A',
        name: 'Royal Stalls',
        rows: ['A', 'B', 'C', 'D', 'E'],
        seatsPerRow: 18,
        tierName: 'Champagne',
        price: 8600,
        accessibleSeats: [
          { row: 'A', seatNumber: 1 },
          { row: 'E', seatNumber: 18 },
        ],
      },
      {
        code: 'B',
        name: 'Grand Stalls',
        rows: ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
        seatsPerRow: 22,
        tierName: 'Gold',
        price: 5400,
      },
      {
        code: 'C',
        name: 'Loge',
        rows: ['N', 'O', 'P', 'Q', 'R'],
        seatsPerRow: 24,
        tierName: 'Silver',
        price: 2850,
      },
    ],
  },
  {
    id: 'ven-rajpath',
    name: 'Rajpath Athletic Stadium',
    address: 'Rovers Marg, Hazratganj',
    locality: 'Hazratganj',
    city: 'Lucknow',
    capacity: 384,
    createdAt: daysFromNow(-540),
    sections: [
      {
        code: 'E',
        name: 'East Stand',
        rows: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'],
        seatsPerRow: 18,
        tierName: 'Champagne',
        price: 4900,
        accessibleSeats: [
          { row: 'E1', seatNumber: 1 },
          { row: 'E1', seatNumber: 18 },
        ],
      },
      {
        code: 'N',
        name: 'North Terrace',
        rows: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'],
        seatsPerRow: 20,
        tierName: 'Gold',
        price: 3200,
      },
      {
        code: 'S',
        name: 'South Terrace',
        rows: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
        seatsPerRow: 20,
        tierName: 'Silver',
        price: 1800,
      },
      {
        code: 'VIP',
        name: 'Pavilion Box',
        rows: ['X1', 'X2'],
        seatsPerRow: 8,
        tierName: 'Platinum',
        price: 10500,
      },
    ],
  },
  {
    id: 'ven-dome',
    name: 'Skyline Convention Dome',
    address: 'Tower B, Rajiv Gandhi Infotech Park, Hinjawadi',
    locality: 'Hinjawadi',
    city: 'Pune',
    capacity: 224,
    createdAt: daysFromNow(-300),
    sections: [
      {
        code: 'A',
        name: 'Auditorium Front',
        rows: ['A', 'B', 'C', 'D'],
        seatsPerRow: 16,
        tierName: 'Champagne',
        price: 6900,
        accessibleSeats: [
          { row: 'A', seatNumber: 1 },
          { row: 'D', seatNumber: 16 },
        ],
      },
      {
        code: 'B',
        name: 'Auditorium Centre',
        rows: ['E', 'F', 'G', 'H', 'I', 'J'],
        seatsPerRow: 18,
        tierName: 'Gold',
        price: 4200,
      },
      {
        code: 'W',
        name: 'Workshop Wing',
        rows: ['W1', 'W2', 'W3'],
        seatsPerRow: 14,
        tierName: 'Silver',
        price: 2200,
      },
      {
        code: 'VIP',
        name: 'Speaker Lounge',
        rows: ['X1'],
        seatsPerRow: 10,
        tierName: 'Platinum',
        price: 11200,
      },
    ],
  },
  {
    id: 'ven-kendra',
    name: 'Jai Hind Kendra',
    address: '4, Begum Hazratabad Marg, Gomti Nagar',
    locality: 'Gomti Nagar',
    city: 'Lucknow',
    capacity: 256,
    createdAt: daysFromNow(-610),
    sections: [
      {
        code: 'A',
        name: 'Main Hall',
        rows: ['A', 'B', 'C', 'D', 'E'],
        seatsPerRow: 14,
        tierName: 'Champagne',
        price: 3600,
        accessibleSeats: [
          { row: 'A', seatNumber: 1 },
          { row: 'E', seatNumber: 14 },
        ],
      },
      {
        code: 'B',
        name: 'Gallery',
        rows: ['F', 'G', 'H', 'I', 'J', 'K'],
        seatsPerRow: 16,
        tierName: 'Gold',
        price: 2100,
      },
      {
        code: 'C',
        name: 'Upper Circle',
        rows: ['L', 'M', 'N', 'O', 'P'],
        seatsPerRow: 18,
        tierName: 'Silver',
        price: 1150,
      },
    ],
  },
  {
    id: 'ven-lakeside',
    name: 'Lakeside Amphitheatre',
    address: 'Sector 62, NH-24',
    locality: 'Sector 62',
    city: 'Noida',
    capacity: 230,
    createdAt: daysFromNow(-210),
    sections: [
      {
        code: 'GA',
        name: 'Lawn A',
        rows: ['A', 'B', 'C'],
        seatsPerRow: 16,
        tierName: 'Champagne',
        price: 5200,
        accessibleSeats: [
          { row: 'A', seatNumber: 1 },
          { row: 'C', seatNumber: 16 },
        ],
      },
      {
        code: 'GB',
        name: 'Lawn B',
        rows: ['D', 'E', 'F', 'G', 'H'],
        seatsPerRow: 18,
        tierName: 'Gold',
        price: 2950,
      },
      {
        code: 'GC',
        name: 'Lawn C',
        rows: ['I', 'J', 'K', 'L'],
        seatsPerRow: 20,
        tierName: 'Silver',
        price: 1490,
      },
      {
        code: 'VIP',
        name: 'Deck',
        rows: ['X1'],
        seatsPerRow: 12,
        tierName: 'Platinum',
        price: 9400,
      },
    ],
  },
]

export const VENUE_BY_ID = new Map(VENUES.map((venue) => [venue.id, venue]))

export const CITIES = [...new Set(VENUES.map((venue) => venue.city))].sort()