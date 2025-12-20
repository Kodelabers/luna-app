import { ApplicationStatus } from "@/lib/types";

export enum CellStatus {
  AVAILABLE = "AVAILABLE", // Sivo (vikend/praznik ili slobodan dan)
  APPROVED = "APPROVED", // Zeleno
  PENDING = "PENDING", // Žuto
  SICK_LEAVE = "SICK_LEAVE", // Narančasto
  CRITICAL = "CRITICAL", // Crveno (previše odsutnih)
}

/**
 * Get color for cell status
 */
export function getCellColor(status: CellStatus): string {
  switch (status) {
    case CellStatus.APPROVED:
      return "bg-green-500"; // Zeleno - odobreni odmori
    case CellStatus.PENDING:
      return "bg-yellow-500"; // Žuto - na čekanju
    case CellStatus.SICK_LEAVE:
      return "bg-orange-500"; // Narančasto - bolovanja
    case CellStatus.CRITICAL:
      return "bg-red-500"; // Crveno - kritična razdoblja
    case CellStatus.AVAILABLE:
    default:
      return "bg-gray-200"; // Sivo - dostupno/vikend/praznik
  }
}

/**
 * Get border color for cell status
 */
export function getCellBorderColor(status: CellStatus): string {
  switch (status) {
    case CellStatus.APPROVED:
      return "border-green-600";
    case CellStatus.PENDING:
      return "border-yellow-600";
    case CellStatus.SICK_LEAVE:
      return "border-orange-600";
    case CellStatus.CRITICAL:
      return "border-red-600";
    case CellStatus.AVAILABLE:
    default:
      return "border-gray-300";
  }
}

/**
 * Get hover color for cell status
 */
export function getCellHoverColor(status: CellStatus): string {
  switch (status) {
    case CellStatus.APPROVED:
      return "hover:bg-green-600";
    case CellStatus.PENDING:
      return "hover:bg-yellow-600";
    case CellStatus.SICK_LEAVE:
      return "hover:bg-orange-600";
    case CellStatus.CRITICAL:
      return "hover:bg-red-600";
    case CellStatus.AVAILABLE:
    default:
      return "hover:bg-gray-300";
  }
}

/**
 * Get text color for cell status
 */
export function getCellTextColor(status: CellStatus): string {
  switch (status) {
    case CellStatus.APPROVED:
    case CellStatus.PENDING:
    case CellStatus.SICK_LEAVE:
    case CellStatus.CRITICAL:
      return "text-white";
    case CellStatus.AVAILABLE:
    default:
      return "text-gray-600";
  }
}

