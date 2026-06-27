-- ============================================================
-- Actualización: agregar campo "costo" a productos
-- Ejecutar en Supabase > SQL Editor > New query
-- ============================================================

-- Agregar columna costo a la tabla productos
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS costo numeric(10,2) not null default 0;

-- Actualizar la vista de ganancia en venta_items para calcular utilidad
-- (el costo se guarda como snapshot al momento de la venta, igual que el precio)
ALTER TABLE venta_items
ADD COLUMN IF NOT EXISTS costo_unitario numeric(10,2) not null default 0;

-- ============================================================
-- Actualizar la función registrar_venta para guardar el costo
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_venta(
  p_items jsonb,
  p_metodo_pago text,
  p_usuario_id uuid
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_venta_id bigint;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_costo numeric(10,2);
BEGIN
  -- calcular total
  SELECT COALESCE(SUM((i->>'cantidad')::int * (i->>'precio_unitario')::numeric), 0)
  INTO v_total
  FROM jsonb_array_elements(p_items) i;

  -- crear cabecera de venta
  INSERT INTO ventas (total, metodo_pago, usuario_id)
  VALUES (v_total, p_metodo_pago, p_usuario_id)
  RETURNING id INTO v_venta_id;

  -- insertar items, guardar costo snapshot y descontar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- obtener costo actual del producto
    SELECT costo INTO v_costo
    FROM productos
    WHERE id = (v_item->>'producto_id')::bigint;

    INSERT INTO venta_items (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, costo_unitario)
    VALUES (
      v_venta_id,
      (v_item->>'producto_id')::bigint,
      v_item->>'nombre_producto',
      (v_item->>'cantidad')::int,
      (v_item->>'precio_unitario')::numeric,
      COALESCE(v_costo, 0)
    );

    UPDATE productos
    SET stock = GREATEST(stock - (v_item->>'cantidad')::int, 0)
    WHERE id = (v_item->>'producto_id')::bigint;
  END LOOP;

  -- registrar ingreso en caja
  INSERT INTO caja_movimientos (tipo, detalle, monto, usuario_id, venta_id)
  VALUES ('Ingreso', 'Venta #' || v_venta_id || ' — ' || p_metodo_pago, v_total, p_usuario_id, v_venta_id);

  RETURN v_venta_id;
END;
$$;
