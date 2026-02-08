-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Variedades (Productos)
create table varieties (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text not null,
  image_url text,
  created_at timestamp with time zone default now()
);

-- 2. Pedidos
create table orders (
  id uuid primary key default uuid_generate_v4(),
  client_name text not null,
  location text,
  status text default 'pending', -- 'pending', 'completed', 'cancelled'
  is_vip boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. Detalles de Pedidos (Relación Pedido-Variedad)
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  variety_id uuid references varieties(id),
  quantity int not null,
  unit text default 'paquetes'
);

-- 4. Compromisos de Surtido (Logística Diaria)
create table supply_commitments (
  id uuid primary key default uuid_generate_v4(),
  variety_id uuid references varieties(id),
  delivery_date date default current_date,
  demand_qty int not null default 0,
  captured_qty int not null default 0,
  captured_by text,
  created_at timestamp with time zone default now()
);

-- 5. Integraciones (Shopify, etc.)
create table integrations (
  id uuid primary key default uuid_generate_v4(),
  platform text not null unique, -- 'shopify', 'woocommerce', etc.
  shop_url text,
  access_token text,
  secret_key text,
  settings jsonb default '{}'::jsonb, -- Store toggles/preferences here
  is_connected boolean default false,
  updated_at timestamp with time zone default now()
);

-- Insert Mock Data (Seed)
insert into varieties (name, sku, image_url) values 
('Rosa Freedom', 'ROS-FRE-60', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRDrp64NFwll_Y-1xLUNMDXBpWsM7-uhg8bPi7WgYlUny0ccHDGpVG2gp0OQLXUymzKzTBGNP3-v2B0FkXIUnXxHqccmUP_-hlxdJiJ4C0KtOjn43HhZca0rbuCH7qJWC1xmlvy6WfiSrM8RqZp2qohj1rnZ8tRRe3nGSGeEohlkNF5TR_AgA1YRPQRxv9vYBYiY96sMiw5cyuGQb67vrdjAd2kovCSGaEbCOrM1QtBCZaP3iTat0h3Vc1MBaPEHWxJmPh6aQ1F-E'),
('Girasol Sunbright', 'SUN-BRI-70', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl1K_IuZByJ-2pBw41WcU-0vISHk8fiB7DP5lIN8G5hNBQVJI__AFpGK6Z3ygXduDQZ1_QHwcUbSt8NCyQJ7hFTyDWqQZibjIIPhpJwxZHcEUrh4n2ck-_17wmJ5xS4x5isGHiFVFP9oHBsQl3-FL7yodsIwDPwjYOKjsqRBROoiLnQMjH844F7fDa_MH2X9nsnXvx--WSPxbimFIPFzFkj7pIKnBZVpbdOnOnlGfkQrwkgVyo1iu5XYDYfl6vEHvCtOCWpJWqlCw'),
('Hortensia Azul', 'HYD-BLU-40', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAq1x0a8ph0uI-bOCwblK5oDWgRTvEM5w4ba5AOMjDGcASSloujl0yzCQTZB6ZBiNL5bA9kx93V83xRxH8SsdEAJlaIzioaTwm7rlVVhIP1-wGbvwNbDYUZm7RO1u-JB3eusoIfWVX7Z77c1-S1RO4o36_9u_Z-qCDNZeg2Z4YTsAq2aENdER_bUUMC3ZTcokCHhvS5I7tL7ryu6_n4758YeKjOcGLNYiwZxIJTI4GuuGgfYowvF0-qB9MRpP_AxEoaGeARZZ5zOqY');

-- Pedidos Ejemplo
insert into orders (client_name, location, is_vip) values 
('Juan Pérez', 'Miami, FL', false),
('Florería Central', 'Orlando, FL', true),
('Evento Corporativo', 'Austin, TX', true);
