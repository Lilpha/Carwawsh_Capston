ALTER TABLE public.shops
  ADD COLUMN has_hot_water BOOLEAN DEFAULT false,
  ADD COLUMN has_indoor_bay BOOLEAN DEFAULT false
;

UPDATE shops
SET
  has_hot_water = (random() > 0.5),
  has_indoor_bay = (random() > 0.5)
;

CREATE OR REPLACE FUNCTION get_nearby_washes (
  user_lat FLOAT8,
  user_lng_FLOAT8,
  is_hotwater BOOLEAN DEFAULT false,
  is_indoor BOOLEAN DEFAULT false,
  search_limit INT DEFAULT 10
)
RETURNS SETOF public.shops AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.shops
  WHERE
    (NOT is_hotwater OR has_hot_water = true)
    AND
    (NOT is_indoor OR has_indoor_bay = true)
  ORDER BY
    location <-> st_setsrid(st_makepoint(user_lng, user_lat), 4326)
  LIMIT search_limit
;
END
;
$$ LANGUAGE plpgsql
;
SELECT *
  FROM public.shops;
