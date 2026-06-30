export interface CardDetails {
  id: string;
  front_image_url: string;
  back_image_url: string;
  sport: string;
  player_name: string;
  year: number;
  brand: string;
  card_number: string;
  is_rookie: boolean;
  is_insert: boolean;
  is_autographed: boolean;
  is_memorabilia: boolean;
  parallel_attributes: {
    serial_num?: string;
    color?: string;
    variation?: string;
  };
  created_at: string;
}
