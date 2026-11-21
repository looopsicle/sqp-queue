export type AdminAttractionId = "sqp-express" | "adventure-ropes" | "wall-climbing";

export type AdminAttraction = {
  id: AdminAttractionId;
  name: string;
  shortName: string;
  category: string;
  description: string;
  location: string;
  capacity: number;
  status: "Buka" | "Jeda" | "Tutup";
  color: string;
};

export const ADMIN_ATTRACTIONS: AdminAttraction[] = [
  {
    id: "sqp-express",
    name: "SQP Express",
    shortName: "Kereta",
    category: "Mini Train",
    description: "Pengelolaan tiket dan antrean SQP Express.",
    location: "Area Mini Train",
    capacity: 20,
    status: "Buka",
    color: "#4D8B45",
  },
  {
    id: "adventure-ropes",
    name: "Adventure Ropes",
    shortName: "Adventure Rope",
    category: "Rope Course",
    description: "Pengelolaan tiket dan antrean Adventure Ropes.",
    location: "Area Adventure",
    capacity: 12,
    status: "Buka",
    color: "#F28C28",
  },
  {
    id: "wall-climbing",
    name: "Wall Climbing",
    shortName: "Wall Climbing",
    category: "Climbing",
    description: "Pengelolaan tiket dan antrean Wall Climbing.",
    location: "Area Wall Climbing",
    capacity: 10,
    status: "Jeda",
    color: "#4D8B45",
  },
];

export function getAdminAttraction(id: string) {
  return ADMIN_ATTRACTIONS.find((item) => item.id === id);
}
