import { Sport } from "@/constants/theme";

export interface ParallelAttributes {
  serial_num?: string;
  color?: string;
  variation?: string;
}

export interface CardDetails {
  id: string;
  front_image_url: string;
  back_image_url: string;
  sport: Sport;
  player_name: string;
  year: number;
  brand: string;
  card_number: string;
  is_rookie: boolean;
  is_hall_of_famer: boolean;
  is_insert: boolean;
  is_autographed: boolean;
  is_memorabilia: boolean;
  parallel_attributes: ParallelAttributes;
  created_at: string;
}

export type CardSummary = Pick<
  CardDetails,
  | "id"
  | "player_name"
  | "brand"
  | "year"
  | "sport"
  | "front_image_url"
  | "is_rookie"
  | "is_hall_of_famer"
  | "is_autographed"
>;

// Shape returned by the identify-card edge function.
export interface AICardResult {
  sport: Sport;
  player_name: string;
  year: number;
  brand: string;
  card_number: string;
  is_rookie: boolean;
  is_hall_of_famer: boolean;
  is_insert: boolean;
  is_autographed: boolean;
  is_memorabilia: boolean;
  parallel_attributes: Required<ParallelAttributes>;
}

// The user-editable subset of a card: everything except its identity, its images, and
// when it was scanned. Shared by the create and edit forms.
export type CardFields = Omit<CardDetails, "id" | "created_at" | "front_image_url" | "back_image_url">;

export type NewCardInput = CardFields & {
  user_id: string;
  front_image_url: string;
  back_image_url: string;
};
