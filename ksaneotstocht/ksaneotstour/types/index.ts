// types/index.ts (Maak deze map/bestand aan indien nog niet gebeurd)

export interface Stop {
    id: number;
    name: string | null;
    latitude: number | null;
    longitude: number | null;
    start_time: string | null; // ISO DateTime String from DB
    end_time: string | null;   // ISO DateTime String from DB
    color: string | null;
    is_manually_disabled: boolean;
    created_at?: string; // Optioneel
}

// Type voor het formulier data
export interface StopFormData {
    name: string;
    latitude: number | null;
    longitude: number | null;
    start_time: string; // Verwacht YYYY-MM-DDTHH:mm format van input
    end_time: string;   // Verwacht YYYY-MM-DDTHH:mm format van input
    color: string;
}

export interface ScoreboardEntry {
  id: number;
  group_name: string;
  score: number;
}