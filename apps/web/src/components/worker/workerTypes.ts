import { WorkerQrAttractionId } from "../../data/dbTypes";

export type WorkerNavTab = "beranda" | "buat-tiket" | "daftar-qr";

export type WorkerReceiptMode = "pos" | "bundling";

export interface BundlingPreset {
  label: string;
  adults: number;
  children: number;
}

export const BUNDLING_OPTIONS: BundlingPreset[] = [
  { label: "Bundling Keluarga (2 Dewasa + 2 Anak)", adults: 2, children: 2 },
  { label: "Bundling Duo Seru (2 Dewasa + 0 Anak)", adults: 2, children: 0 },
  { label: "Bundling Sahabat Kecil (1 Dewasa + 2 Anak)", adults: 1, children: 2 },
];

export interface WorkerAttractionMeta {
  attractionLabel: string;
  headerBadgeLabel: string;
  formAttractionTitle: string;
  workerName: string;
  avatarSrc: string;
}

/**
 * Maps the active Worker ride ID to its display strings and staff avatar.
 */
export function getWorkerAttractionMeta(
  selectedAttraction: WorkerQrAttractionId
): WorkerAttractionMeta {
  if (selectedAttraction === "sqp-express") {
    return {
      attractionLabel: "SQP Express",
      headerBadgeLabel: "SQP Express",
      formAttractionTitle: "SQP Express (Mini Train)",
      workerName: "Kevin.SQPExpress",
      avatarSrc: "/assets/visitor/avatar-sqp-express.png",
    };
  }
  return {
    attractionLabel: "Roll Glider",
    headerBadgeLabel: "Roll Glider • Adventure Rope",
    formAttractionTitle: "Roll Glider (Adventure Rope)",
    workerName: "Petugas.RollGlider",
    avatarSrc: "/assets/visitor/avatar-adventure-ropes.png",
  };
}
