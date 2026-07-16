-- Hall of Fame status is a property of the player, not the printed card, so it is stored
-- alongside the card's own attributes rather than derived from them. Existing rows default
-- to false; they can be corrected by re-scanning or editing the card.
ALTER TABLE public.cards
    ADD COLUMN is_hall_of_famer BOOLEAN NOT NULL DEFAULT false;

-- The inventory screen filters on this flag, and every query is already scoped to a single
-- user_id, so the composite index matches the actual access pattern.
CREATE INDEX cards_user_hall_of_famer_idx
    ON public.cards (user_id)
    WHERE is_hall_of_famer;
