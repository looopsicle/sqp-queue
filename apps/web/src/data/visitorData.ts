export type AttractionId = "sqp-express" | "wall-climbing" | "adventure-ropes";

export interface AttractionRequirement {
  icon: string;
  label: string;
  value?: string;
  bullets?: string[];
}

export interface PriceTier {
  name?: string;
  items: string[];
}

export interface Attraction {
  id: AttractionId;
  name: string;
  category: string;
  status: "Operational" | "Maintenance" | "Closed";
  stripWaitLabel: string;
  waitMinutes: number;
  inQueueCount: number;
  heroImage: string;
  cardImage: string;
  avatarImage: string;
  ticketIllustration: string;
  ticketCardBg: string;
  shortHours: string;
  shortPrice: string;
  description: string;
  requirements: AttractionRequirement[];
  safetyIcon: string;
  safetyBullets: string[];
  showSafetyHeading: boolean;
  operatingHours: { label: string; value: string }[];
  priceSummary?: string;
  priceTiers?: PriceTier[];
  ctaLabel: string;
}

export type TicketQueueStatus = "not_joined" | "in_queue" | "used";

export interface VisitorTicket {
  id: string;
  receiptId: string;
  orderRef?: string;
  attractionId: AttractionId;
  attractionName: string;
  cardThumbImage: string;
  myTicketsIllustration: string;
  myTicketsBg: string;
  guestSummaryHome: string;
  guestSummaryMyTickets: string;
  holderName: string;
  membersLabel: string;
  validDateLine1: string;
  validDateLine2: string;
  includes: string[];
  queueStatus: TicketQueueStatus;
  queuePosition: string;
  queueNodes: string[];
  estimatedBoardingTime: string;
  joinedQueueAt: string;
  usedDateText?: string;
}

export interface SampleReceiptPreset {
  id: string;
  receiptId: string; // Order Number (e.g. SQP261102103019)
  orderRef: string; // Order Ref (e.g. SQP-261102160236150UA)
  title: string;
  imageUrl: string;
  timestamp: string;
  kiosk: string;
  paymentMethod: string;
  totalAmount: string;
  taxAmount: string;
  rawReceiptText: string;
  items: {
    attractionId: AttractionId;
    name: string;
    promoNote?: string;
    qty: number;
    unitPrice: string;
    subtotal: string;
    unitLabel: string;
    orderNumberOverride?: string;
    orderRefOverride?: string;
  }[];
}

export const ATTRACTIONS: Record<AttractionId, Attraction> = {
  "sqp-express": {
    id: "sqp-express",
    name: "SQP Express",
    category: "Rides • Family Activity",
    status: "Operational",
    stripWaitLabel: "10 min wait • operational",
    waitMinutes: 20,
    inQueueCount: 20,
    heroImage: "/assets/visitor/sqp-express.png",
    cardImage: "/assets/visitor/sqp-express.png",
    avatarImage: "/assets/visitor/avatar-sqp-express.png",
    ticketIllustration: "/assets/visitor/illus-train.png",
    ticketCardBg: "#FBE8A8",
    shortHours: "08:00 - 17:00, 08:00 - 18:00",
    shortPrice: "RP50.000 - RP65.000",
    description:
      "Nikmati petualangan seru bersama keluarga dengan SQP Express! Kereta mini klasik ini siap mengajak kamu berkeliling area taman yang asri dan penuh petualangan seru. Duduk santai, nikmati pemandangan hijau di sepanjang jalur, dan rasakan pengalaman naik kereta yang menyenangkan untuk anak-anak maupun orang dewasa.",
    requirements: [
      {
        icon: "/assets/visitor/icon-steam-train.svg",
        label: "Ride Type",
        value: "Mini Train",
      },
      {
        icon: "/assets/visitor/icon-clock-orange.svg",
        label: "Duration",
        value: "1 round trip (1x ride per ticket)",
      },
      {
        icon: "/assets/visitor/icon-parent-child.svg",
        label: "Child Safety",
        value:
          "Children under 10 years old and under 120 cm must be accompanied by an adult",
      },
      {
        icon: "/assets/visitor/icon-weight.svg",
        label: "Maximum Weight",
        value: "90 kg",
      },
    ],
    safetyIcon: "/assets/visitor/icon-warning.svg",
    showSafetyHeading: true,
    safetyBullets: [
      "Children with special need must be accompanied by an adult",
      "Pregnant women and visitors with hypertension or heart conditions are not advised to ride",
    ],
    operatingHours: [
      { label: "Weekday:", value: "08:00 - 17:00" },
      { label: "Weekend & Holiday:", value: "08:00 - 18:00" },
    ],
    priceSummary: "RP50.000 - RP65.000",
    ctaLabel: "View My Ticket",
  },
  "wall-climbing": {
    id: "wall-climbing",
    name: "Wall Climbing",
    category: "Adventure • Sport Activity",
    status: "Operational",
    stripWaitLabel: "10 min wait • operational",
    waitMinutes: 20,
    inQueueCount: 20,
    heroImage: "/assets/visitor/detail-wall-climbing.png",
    cardImage: "/assets/visitor/wall-climbing.png",
    avatarImage: "/assets/visitor/avatar-wall-climbing.png",
    ticketIllustration: "/assets/visitor/ticket-wall-climbing.png",
    ticketCardBg: "#E8EFD9",
    shortHours: "08:00 - 11:00 | 16:00 - 18:00...",
    shortPrice: "Free",
    description:
      "Challenge your strength and stamina as you climb. Safety equipment and protective gear are provided for a secure and exciting climbing experience at Scientia Square Park.",
    requirements: [
      {
        icon: "/assets/visitor/icon-users-orange.svg",
        label: "All Ages",
      },
      {
        icon: "/assets/visitor/icon-user-orange.svg",
        label: "Maximum capacity:",
        value: "1 person",
      },
      {
        icon: "/assets/visitor/icon-medical-kit.svg",
        label: "Full protective equipment required",
      },
    ],
    safetyIcon: "/assets/visitor/icon-warning.svg",
    showSafetyHeading: false,
    safetyBullets: [],
    operatingHours: [
      { label: "Weekday:", value: "08:00 - 11:00 | 16:00 - 18:00" },
      { label: "Weekend & Holiday:", value: "08:00 - 18:00 | 15:00 - 19:00" },
    ],
    priceSummary: "Free",
    ctaLabel: "Claim My Ticket",
  },
  "adventure-ropes": {
    id: "adventure-ropes",
    name: "Adventure Ropes",
    category: "Adventure • Outdoor Activity",
    status: "Operational",
    stripWaitLabel: "10 min wait • operational",
    waitMinutes: 20,
    inQueueCount: 20,
    heroImage: "/assets/visitor/adventure-ropes.png",
    cardImage: "/assets/visitor/adventure-ropes.png",
    avatarImage: "/assets/visitor/avatar-adventure-ropes.png",
    ticketIllustration: "/assets/visitor/illus-ropes.svg",
    ticketCardBg: "#DDE9A9",
    shortHours: "08:00 - 11:00 | 16:00 - 18:00...",
    shortPrice: "RP25.000 - RP50.000",
    description:
      "Take on rope challenges and get the thrill of gliding through the air at Scientia Square Park. Experience high ropes obstacles and the Roll Glider with complete safety harness equipment.",
    requirements: [
      {
        icon: "/assets/visitor/icon-users-orange.svg",
        label: "Roll Glider",
        bullets: [
          "Weight: 30 - 100 kg",
          "Height: 135 - 200 cm",
          "Under 65 years old",
        ],
      },
      {
        icon: "/assets/visitor/icon-user-orange.svg",
        label: "High Ropes",
        bullets: ["Minimum height: 135 cm", "Maximum weight: 120 kg"],
      },
      {
        icon: "/assets/visitor/icon-parent-child.svg",
        label: "Kiddy Ropes",
        bullets: ["Minimum height: 135 cm", "Maximum weight: 120 kg"],
      },
    ],
    safetyIcon: "/assets/visitor/icon-warning.svg",
    showSafetyHeading: false,
    safetyBullets: [
      "Wear suitable footwear, tie long hair, and remove loose items and jewelry before playing",
    ],
    operatingHours: [
      { label: "Weekday:", value: "08:00 - 11:00 | 16:00 - 18:00" },
      { label: "Weekend & Holiday:", value: "08:00 - 18:00 | 15:00 - 19:00" },
    ],
    priceTiers: [
      {
        name: "Roll Glider:",
        items: ["Weekday Rp35,000", "Weekend/Holiday Rp50,000"],
      },
      {
        name: "Rope Course:",
        items: ["Weekday Rp25,000", "Weekend/Holiday Rp40,000"],
      },
    ],
    ctaLabel: "View My Ticket",
  },
};

export const INITIAL_TICKETS: VisitorTicket[] = [
  {
    id: "tkt-wall-climbing",
    receiptId: "SQP261102103019",
    orderRef: "SQP-261102160236150UA",
    attractionId: "wall-climbing",
    attractionName: "Wall Climbing",
    cardThumbImage: "/assets/visitor/ticket-wall-climbing.png",
    myTicketsIllustration: "/assets/visitor/ticket-wall-climbing.png",
    myTicketsBg: "#E8EFD9",
    guestSummaryHome: "1 Person",
    guestSummaryMyTickets: "1 Ticket • 1 Guest",
    holderName: "James",
    membersLabel: "1 Member",
    validDateLine1: "valid on 02 nov 2026",
    validDateLine2: "08.00 - 18.00",
    includes: [
      "1 climber admission",
      "Full safety harness & helmet rental",
      "1x Guided Wall Climbing Session",
      "Valid on Selected Date",
    ],
    queueStatus: "not_joined",
    queuePosition: "W1N05",
    queueNodes: ["W1N01", "W1N02", "W1N03", "W1N04", "YOU"],
    estimatedBoardingTime: "16:25",
    joinedQueueAt: "15.10",
  },
  {
    id: "tkt-adventure-ropes",
    receiptId: "SQP261101102913",
    orderRef: "SQP-261101161624942IF",
    attractionId: "adventure-ropes",
    attractionName: "Adventure Ropes",
    cardThumbImage: "/assets/visitor/adventure-ropes.png",
    myTicketsIllustration: "/assets/visitor/illus-ropes.svg",
    myTicketsBg: "#DDE9A9",
    guestSummaryHome: "2 members",
    guestSummaryMyTickets: "1 Ticket • 2 Guest",
    holderName: "James",
    membersLabel: "2 Members",
    validDateLine1: "valid on 01 nov 2026",
    validDateLine2: "08.00 - 18.00",
    includes: [
      "2 guests admission",
      "Roll Glider Weekend Access",
      "Full protective gear included",
      "Valid on Selected Date",
    ],
    queueStatus: "not_joined",
    queuePosition: "R3N08",
    queueNodes: ["R3N04", "R3N05", "R3N06", "R3N07", "YOU"],
    estimatedBoardingTime: "16:40",
    joinedQueueAt: "15.20",
  },
  {
    id: "tkt-sqp-express",
    receiptId: "SQP261102103019",
    orderRef: "SQP-261102160236150UA",
    attractionId: "sqp-express",
    attractionName: "SQP Express",
    cardThumbImage: "/assets/visitor/ticket-sqp-express.png",
    myTicketsIllustration: "/assets/visitor/illus-train.png",
    myTicketsBg: "#FBE8A8",
    guestSummaryHome: "3 members",
    guestSummaryMyTickets: "1 Ticket • 3 Passengers",
    holderName: "James",
    membersLabel: "3 Members",
    validDateLine1: "valid on 02 nov 2026",
    validDateLine2: "08.00 - 18.00",
    includes: [
      "3 passengers (PROMO MINI TRAIN WEEKDAY)",
      "1x Train Ride per Passenger",
      "1 Round Trip on Designated Route",
      "Valid on Selected Date",
    ],
    queueStatus: "in_queue",
    queuePosition: "B2N10",
    queueNodes: ["B2N06", "B2N07", "B2N08", "B2N09", "YOU"],
    estimatedBoardingTime: "16:10",
    joinedQueueAt: "16.02",
  },
];

export const INITIAL_HISTORY_TICKETS: VisitorTicket[] = [
  {
    id: "hist-wall-climbing",
    receiptId: "SQP261025101102",
    attractionId: "wall-climbing",
    attractionName: "Wall Climbing",
    cardThumbImage: "/assets/visitor/ticket-wall-climbing.png",
    myTicketsIllustration: "/assets/visitor/ticket-wall-climbing.png",
    myTicketsBg: "#FFFFFF",
    guestSummaryHome: "1 Person",
    guestSummaryMyTickets: "1 Ticket • 1 Guest",
    holderName: "James",
    membersLabel: "1 Member",
    validDateLine1: "valid on 25 oct 2026",
    validDateLine2: "08.00 - 18.00",
    includes: ["1 climber admission", "Full safety harness & helmet rental"],
    queueStatus: "used",
    queuePosition: "W1N02",
    queueNodes: ["W1N01", "YOU"],
    estimatedBoardingTime: "10:30",
    joinedQueueAt: "10.10",
    usedDateText: "25 Oct 2026",
  },
  {
    id: "hist-adventure-ropes",
    receiptId: "SQP261025101102",
    attractionId: "adventure-ropes",
    attractionName: "Adventure Ropes",
    cardThumbImage: "/assets/visitor/adventure-ropes.png",
    myTicketsIllustration: "/assets/visitor/illus-ropes.svg",
    myTicketsBg: "#FFFFFF",
    guestSummaryHome: "3 Guests",
    guestSummaryMyTickets: "1 Ticket • 3 Guest",
    holderName: "James",
    membersLabel: "3 Members",
    validDateLine1: "valid on 25 oct 2026",
    validDateLine2: "08.00 - 18.00",
    includes: ["3 guests admission", "High Ropes & Roll Glider access"],
    queueStatus: "used",
    queuePosition: "R2N04",
    queueNodes: ["R2N03", "YOU"],
    estimatedBoardingTime: "13:15",
    joinedQueueAt: "12.50",
    usedDateText: "25 Oct 2026",
  },
  {
    id: "hist-sqp-express",
    receiptId: "SQP261025101102",
    attractionId: "sqp-express",
    attractionName: "SQP Express",
    cardThumbImage: "/assets/visitor/ticket-sqp-express.png",
    myTicketsIllustration: "/assets/visitor/illus-train.png",
    myTicketsBg: "#FFFFFF",
    guestSummaryHome: "5 Passengers",
    guestSummaryMyTickets: "1 Ticket • 5 Passengers",
    holderName: "James",
    membersLabel: "5 Members",
    validDateLine1: "valid on 25 oct 2026",
    validDateLine2: "08.00 - 18.00",
    includes: ["5 passengers", "1x Train Ride per Passenger"],
    queueStatus: "used",
    queuePosition: "B1N09",
    queueNodes: ["B1N08", "YOU"],
    estimatedBoardingTime: "15:40",
    joinedQueueAt: "15.15",
    usedDateText: "25 Oct 2026",
  },
];

/**
 * Exact real Scientia Square Park thermal receipts from `C:\Users\MSI\Pictures\SQP tickets`
 */
export const SAMPLE_RECEIPT_PRESETS: SampleReceiptPreset[] = [
  {
    id: "receipt-minitrain-1",
    receiptId: "SQP261102103019",
    orderRef: "SQP-261102160236150UA",
    title: "Kiosk Mini Train (3x Promo Weekday)",
    imageUrl: "/assets/receipts/receipt-minitrain-1.jpeg",
    timestamp: "02/11/2026 16:02:36",
    kiosk: "kiosk1 • Kiosk Mini Train",
    paymentMethod: "QRIS Dinamis",
    totalAmount: "Rp 120.000",
    taxAmount: "Rp 10.909",
    rawReceiptText: [
      "SQP Park",
      "(021) 5961820",
      "https://scientiasquarepark.com",
      "kiosk1",
      "Kiosk Mini Train",
      "PROMO MINI TRAIN WEEKDAY POT. Rp10.000,-",
      "3 x Rp 40.000 = 120.000",
      "TOTAL Rp 120.000",
      "QRIS Dinamis Rp 120.000",
      "Total Tax Rp 10.909",
      "Order Ref: SQP-261102160236150UA",
      "Order Number: SQP261102103019",
      "02/11/2026 16:02:36",
    ].join("\n"),
    items: [
      {
        attractionId: "sqp-express",
        name: "PROMO MINI TRAIN WEEKDAY",
        promoNote: "POT. Rp10.000,-",
        qty: 3,
        unitPrice: "Rp 40.000",
        subtotal: "Rp 120.000",
        unitLabel: "Passengers",
      },
    ],
  },
  {
    id: "receipt-adventure-ropes",
    receiptId: "SQP261101102913",
    orderRef: "SQP-261101161624942IF",
    title: "Kiosk Adventure Ropes (2x Roll Glider)",
    imageUrl: "/assets/receipts/receipt-adventure-ropes.jpeg",
    timestamp: "01/11/2026 16:16:24",
    kiosk: "kiosk1 • Kiosk Adventure ropes",
    paymentMethod: "QRIS Dinamis",
    totalAmount: "Rp 100.000",
    taxAmount: "Rp 9.090",
    rawReceiptText: [
      "SQP Park",
      "(021) 5961820",
      "https://scientiasquarepark.com",
      "kiosk1",
      "Kiosk Adventure ropes",
      "ROLL GLIDER WEEKEND",
      "2 x Rp 50.000 = 100.000",
      "TOTAL Rp 100.000",
      "QRIS Dinamis Rp 100.000",
      "Total Tax Rp 9.090",
      "Order Ref: SQP-261101161624942IF",
      "Order Number: SQP261101102913",
      "01/11/2026 16:16:24",
      "Copy 1: Customer",
    ].join("\n"),
    items: [
      {
        attractionId: "adventure-ropes",
        name: "ROLL GLIDER WEEKEND",
        qty: 2,
        unitPrice: "Rp 50.000",
        subtotal: "Rp 100.000",
        unitLabel: "Guest",
      },
    ],
  },
  {
    id: "receipt-dual-minitrain",
    receiptId: "SQP261102103019 + SQP261102103018",
    orderRef: "SQP-261102160236150UA & SQP-261102160210691ZQ",
    title: "Dual Receipts: Mini Train (3x & 2x)",
    imageUrl: "/assets/receipts/receipt-dual-minitrain.jpeg",
    timestamp: "02/11/2026 16:02:36 & 16:02:10",
    kiosk: "kiosk1 • Kiosk Mini Train (2 Receipts)",
    paymentMethod: "QRIS Dinamis",
    totalAmount: "Rp 120.000 + Rp 80.000",
    taxAmount: "Rp 10.909 + Rp 7.272",
    rawReceiptText: [
      "[Receipt 1 - Left]",
      "SQP Park • kiosk1 • Kiosk Mini Train",
      "PROMO MINI TRAIN WEEKDAY POT. Rp10.000,-",
      "3 x Rp 40.000 = 120.000 | TOTAL Rp 120.000",
      "Order Ref: SQP-261102160236150UA",
      "Order Number: SQP261102103019 (02/11/2026 16:02:36)",
      "",
      "[Receipt 2 - Right]",
      "SQP Park • kiosk1 • Kiosk Mini Train",
      "PROMO MINI TRAIN WEEKDAY POT. Rp10.000,-",
      "2 x Rp 40.000 = 80.000 | TOTAL Rp 80.000",
      "Order Ref: SQP-261102160210691ZQ",
      "Order Number: SQP261102103018 (02/11/2026 16:02:10)",
    ].join("\n"),
    items: [
      {
        attractionId: "sqp-express",
        name: "PROMO MINI TRAIN WEEKDAY (Receipt 1)",
        promoNote: "POT. Rp10.000,-",
        qty: 3,
        unitPrice: "Rp 40.000",
        subtotal: "Rp 120.000",
        unitLabel: "Passengers",
        orderNumberOverride: "SQP261102103019",
        orderRefOverride: "SQP-261102160236150UA",
      },
      {
        attractionId: "sqp-express",
        name: "PROMO MINI TRAIN WEEKDAY (Receipt 2)",
        promoNote: "POT. Rp10.000,-",
        qty: 2,
        unitPrice: "Rp 40.000",
        subtotal: "Rp 80.000",
        unitLabel: "Passengers",
        orderNumberOverride: "SQP261102103018",
        orderRefOverride: "SQP-261102160210691ZQ",
      },
    ],
  },
];
