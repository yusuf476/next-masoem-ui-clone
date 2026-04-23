create table if not exists public.categories (
  slug text primary key,
  name text not null,
  description text not null
);

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null references public.categories(slug) on delete restrict,
  price integer not null,
  rating numeric(2, 1) not null default 0,
  reviews integer not null default 0,
  featured boolean not null default false,
  inventory integer not null default 0,
  tagline text not null,
  description text not null,
  features jsonb not null default '[]'::jsonb,
  image text not null
);

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  student_id text not null,
  faculty text not null,
  phone text not null,
  joined_at timestamptz not null default timezone('utc', now()),
  role text not null default 'customer' check (role in ('admin', 'customer')),
  email_verified_at timestamptz,
  verification_token_hash text,
  verification_token_expires_at timestamptz,
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  failed_login_count integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  wishlist jsonb not null default '[]'::jsonb,
  notifications jsonb not null default '[]'::jsonb
);

alter table if exists public.users add column if not exists email_verified_at timestamptz;
alter table if exists public.users add column if not exists verification_token_hash text;
alter table if exists public.users add column if not exists verification_token_expires_at timestamptz;
alter table if exists public.users add column if not exists reset_token_hash text;
alter table if exists public.users add column if not exists reset_token_expires_at timestamptz;
alter table if exists public.users add column if not exists failed_login_count integer not null default 0;
alter table if exists public.users add column if not exists locked_until timestamptz;
alter table if exists public.users add column if not exists last_login_at timestamptz;
alter table if exists public.users add column if not exists wishlist jsonb not null default '[]'::jsonb;
alter table if exists public.users add column if not exists notifications jsonb not null default '[]'::jsonb;

create table if not exists public.sessions (
  token text primary key,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.carts (
  user_id text primary key references public.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb
);

create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  user_id text not null references public.users(id) on delete cascade,
  status text not null,
  payment_status text not null default 'paid',
  payment_reference text,
  payment_provider text,
  payment_token text,
  payment_url text,
  payment_payload jsonb,
  stock_applied boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  estimated_ready_at timestamptz not null,
  fulfillment_method text not null,
  payment_method text not null,
  notes text not null default '',
  shipping jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0,
  service_fee integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null default 0
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_users_joined_at on public.users(joined_at desc);
create index if not exists idx_users_email_verified_at on public.users(email_verified_at);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
