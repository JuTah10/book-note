-- postgresql
CREATE DATABASE booknote;
CREATE TABLE IF NOT EXISTS public.booknote
(
    id SERIAL PRIMARY KEY,
    title text UNIQUE,
    author text,
    dateread date,
    coverimglink text,
    note text,
    rating integer,
    isbn bigint,
    description text,
    CONSTRAINT booknote_rating_check CHECK (rating >= 1 AND rating <= 10)
)