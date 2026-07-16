-- A lot scan photographs only the fronts of a group of cards laid out together, so cards
-- created that way have no back image at all. Single scans still capture both sides and
-- continue to populate this column.
ALTER TABLE public.cards
    ALTER COLUMN back_image_url DROP NOT NULL;
