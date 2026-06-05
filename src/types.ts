/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Activity {
  title: string;
  description: string;
  timeOfDay: "Morning" | "Afternoon" | "Evening" | "صباحاً" | "مساءً" | "بعد الظهر";
  durationHours: number;
  estimatedCostUSD: number;
  locationName: string;
}

export interface DayPlan {
  dayNumber: number;
  theme: string;
  activities: Activity[];
}

export interface HotelRecommendation {
  name: string;
  stars: number;
  pricePerNightUSD: number;
  ratingValue: number;
  reasonForRecommendation: string;
  phoneNumber?: string;
  address?: string;
}

export interface EventAdvisory {
  name: string;
  date: string;
  advisabilityNote: string; // text explaining whether to attend, postpone or enjoy
}

export interface EmergencyContact {
  label: string;
  phone: string;
}

export interface PopularMarket {
  name: string;
  type: string;
  description: string;
}

export interface TraditionalDelicacy {
  name: string;
  description: string;
}

export interface GoogleMapsSim {
  accommodationName: string;
  accommodationQuery: string;
  primarySpotName: string;
  primarySpotQuery: string;
  distanceKMText: string;
  recommendedTaxiApp: string;
  taxiFareEstimateLocal: string;
  transitAdviceStep: string;
}

export interface MissionDestination {
  name: string;
  estimatedQueueTime: string;
  transitAdvice: string;
  documentsRequired: string[];
  googleMapsQuery: string;
  phoneNumber?: string;
  address?: string;
}

export interface AdministrativeMissionDetails {
  missionOverview: string;
  destinationsList: MissionDestination[];
}

export interface NearbyPlace {
  name: string;
  type: string;
  description: string;
  googleMapsQuery: string;
}

export interface MosquePlace {
  name: string;
  prayerTimesTransitAdvice: string; // Transit / prayer advice and restroom information
  hasPublicRestroom: boolean;
  googleMapsQuery: string;
}

export interface MedicalPlace {
  name: string;
  type: string; // pharmacy, laboratory, clinic, hospital
  description: string;
  googleMapsQuery: string;
  phoneNumber?: string;
}

export interface AlternativeLodging {
  name: string;
  type: string; // hotel, motel, guesthouse, home, room
  priceEstimateLocal: string;
  googleMapsQuery: string;
  phoneNumber?: string;
}

export interface NearbyPlacesAndUtilities {
  restaurantsAndCafes: NearbyPlace[];
  mosquesAndRestrooms: MosquePlace[];
  medicalServices: MedicalPlace[];
  nearbyAlternativeLodgings: AlternativeLodging[];
  businessAndPrintingServices?: NearbyPlace[];
}

export interface TransitSchedule {
  transportMethod: string;
  departureDayTime: string;
  stationName: string;
  frequencyAndPrice: string;
  contactPhone?: string;
}

export interface Itinerary {
  destinationName: string;
  country: string;
  tripDurationDays: number;
  targetBudgetLevel: string;
  travelerType: string;
  languageCode: "ar" | "en";
  days: DayPlan[];
  suggestedHotels: HotelRecommendation[];
  customPackingList: {
    category: string;
    items: string[];
  }[];
  localTravelTips: string[];
  departureDate?: string;
  allocatedBudgetAmount?: string;
  transitMode?: string;
  climateAdvisoryAlert?: string; // e.g. delay/advance the trip warning 
  localEventsAndExpos?: EventAdvisory[]; // events causing possible reschedule
  
  // NEW ADDITIONS
  isDomesticTrip?: boolean;
  localCurrencySymbol?: string;
  emergencyNumbers?: EmergencyContact[];
  bookingRequirements?: string[];
  localTraditionalCuisine?: TraditionalDelicacy[];
  popularMarketsAndSouks?: PopularMarket[];
  googleMapsSim?: GoogleMapsSim;

  // ADDITIONAL VISITS, UTILITIES, PURPOSE & LODGING TYPE EXTRACTIONS
  tripPurpose?: string;
  missionDestinationsText?: string;
  lodgingType?: string;
  administrativeMissionDetails?: AdministrativeMissionDetails;
  nearbyPlacesAndUtilities?: NearbyPlacesAndUtilities;
  estimatedTransitSchedules?: TransitSchedule[];

  // PREMIUM OPTIONAL ADD-ONS & BENEFITS
  originWilaya?: string;
  coordinationType?: "optional" | "fos7a";
  insurancePolicy?: {
    enabled: boolean;
    type: "basic" | "premium" | "comprehensive";
    days: number;
    zone: "local" | "mena" | "europe" | "worldwide";
    premiumUSD: number;
    ageGroup: "youth" | "adult" | "senior";
  };
  fos7aSponsorship?: {
    enabled: boolean;
    travelConfig: "solo" | "group" | "family" | "couple" | "lovers";
    tripTheme: "cultural" | "sahara" | "mountain" | "coastal" | "business";
    departureWilaya: string;
    includeReturn: boolean;
    estimatedMinDZD: number;
    estimatedMaxDZD: number;
    submitted?: boolean;
  };
  isOfflineFallback?: boolean;
}

export interface FlightMock {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  priceUSD: number;
  stops: number;
  luggageDetail?: string;
  mealOption?: string;
  aircraftModel?: string;
  cabinClass?: string;
}

export interface HotelMock {
  name: string;
  stars: number;
  rating: number;
  reviews: number;
  priceUSD: number;
  imageUrl: string;
  address: string;
  amenities: string[];
  roomType?: string;
  breakfastIncluded?: boolean;
  cancellationPolicy?: string;
  availableRoomsCount?: number;
}

export interface SavedTrip {
  id: string;
  itinerary: Itinerary;
  selectedFlight?: FlightMock;
  selectedHotel?: HotelMock;
  diaryEntries?: any[];
  createdAt: string;
}

export interface Message {
  role: "user" | "model";
  text: string;
  timestamp: string;
  isOfflineFallback?: boolean;
}
