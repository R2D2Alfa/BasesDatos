CREATE TABLE categoria(
categoria_id    numeric(10) not null,
nombre          varchar(40) not null,
CONSTRAINT pk_categoria PRIMARY KEY(categoria_id)
);

CREATE TABLE telefono(
telefono_id    numeric(10) not null,
telefono       varchar(40) not null,
CONSTRAINT pk_telefono_id PRIMARY KEY(telefono_id),
CONSTRAINT uq_telefono UNIQUE(telefono)
);

CREATE TABLE sucursal(
sucursal_id     numeric(10) not null,
ubicacion       varchar(40) not null,
telefono        varchar(40) not null,
año_fundacion   SMALLINT not null,
CONSTRAINT pk_sucursal PRIMARY KEY(sucursal_id)
);


CREATE TABLE empleado (
empleado_id     numeric(10) not null,
supervisor_id   numeric(10),
sucursal_id     numeric(10) not null,
telefono_id     numeric(10) not null,
num_empleado    varchar(10) not null,
rfc             varchar(40) not null,
 curp            varchar(40) not null, 
nombre          varchar(40) not null,
ap_paterno      varchar(40) not null,
ap_materno      varchar(40),
calle           varchar(40) not null,
numero          varchar(10) not null,
cp              varchar(40) not null,
colonia         varchar(40) not null,
estado          varchar(40) not null,
email           varchar(40) not null,
fecha_ingreso   date not null,
tipo_empleado   varchar(10) not null,
    
CONSTRAINT pk_empleado PRIMARY KEY(empleado_id),
CONSTRAINT fk_empleado_supervisor FOREIGN KEY(supervisor_id) REFERENCES empleado(empleado_id),
CONSTRAINT fk_empleado_sucursal FOREIGN KEY(sucursal_id) REFERENCES sucursal(sucursal_id),
CONSTRAINT fk_empleado_telefono FOREIGN KEY(telefono_id) REFERENCES telefono(telefono_id),
CONSTRAINT uq_num_empleado UNIQUE (num_empleado),
CONSTRAINT chk_tipo_empleado CHECK (
    tipo_empleado IN ('cajero', 'vendedor', 'administrativo', 'seguridad', 'limpieza')
 )
);



CREATE TABLE cliente(
cliente_id      numeric(10) not null,  
rfc             varchar(40) not null, 
nombre          varchar(40) not null,
ap_paterno      varchar(40) not null,
ap_materno      varchar(40) null,
razon_social    varchar(40) null,
calle           varchar(40) not null,
numero          varchar(40) not null,
cp              varchar(40) not null,
colonia         varchar(40) not null,
estado          varchar(40) not null,
email           varchar(40) not null,
telefono        varchar(40) not null,
CONSTRAINT pk_cliente PRIMARY KEY(cliente_id),
CONSTRAINT uq_cliente_rfc UNIQUE (rfc)
);


CREATE TABLE proveedor(
proveedor_id    numeric(10) not null,  
rfc             varchar(40) not null,
razon_social    varchar(40) not null,
calle           varchar(40) not null,
numero          varchar(40) not null,
cp              varchar(40) not null,
colonia         varchar(40) not null,
estado          varchar(40) not null,
telefono        varchar(40) not null,
num_cuenta      varchar(40) not null,
CONSTRAINT pk_proveedor PRIMARY KEY(proveedor_id),
CONSTRAINT uq_proveedor_rfc UNIQUE (rfc)
);


CREATE TABLE articulo(
articulo_id     numeric(10) not null,
categoria_id    numeric(10) not null,
cod_barras      varchar(40) not null,
nombre          varchar(40) not null,
precio_venta    numeric(20,2) not null,
precio_compra   numeric(20,2) not null,
stock           numeric(20) not null,
fotografia      bytea   not null,
CONSTRAINT pk_articulo PRIMARY KEY(articulo_id),
CONSTRAINT fk_articulo_categoria FOREIGN KEY(categoria_id) REFERENCES categoria(categoria_id),
CONSTRAINT uq_cod_barras UNIQUE (cod_barras)
);

CREATE TABLE articulo_proveedor(
articulo_proveedor_id   numeric(10) not null,
articulo_id             numeric(10) not null,
proveedor_id            numeric(10) not null,
fecha_inicio_surtido DATE,
CONSTRAINT pk_articulo_proveedor PRIMARY KEY(articulo_proveedor_id),
CONSTRAINT fk_articulo_proveedor1 FOREIGN KEY(articulo_id) REFERENCES articulo(articulo_id),
CONSTRAINT fk_articulo_proveedor2 FOREIGN KEY(proveedor_id) REFERENCES proveedor(proveedor_id)
);

CREATE TABLE venta(
venta_id                numeric(10) not null,
empleado_vendedor_id    numeric(10) not null,
empleado_cobrador_id    numeric(10) not null,
cliente_id              numeric(10),
folio                   varchar(40) not null,
fecha_venta             date not null, 
monto_total             numeric(20,2) not null DEFAULT 0.00,
cantidad_articulos      numeric(10,0)not null DEFAULT 0,
CONSTRAINT pk_venta PRIMARY KEY(venta_id),
CONSTRAINT fk_venta_asesor FOREIGN KEY(empleado_vendedor_id) REFERENCES empleado(empleado_id),
CONSTRAINT fk_venta_cobrador FOREIGN KEY(empleado_cobrador_id) REFERENCES empleado(empleado_id),
CONSTRAINT fk_venta_cliente FOREIGN KEY(cliente_id) REFERENCES cliente(cliente_id),
CONSTRAINT uq_folio_venta UNIQUE (folio)
);

CREATE TABLE articulo_venta(
articulo_venta_id    numeric(10) not null,
articulo_id          numeric(10) not null,
venta_id             numeric(10) not null,
cantidad             numeric(10) not null,
monto_por_articulo   numeric(20,2) not null,
CONSTRAINT pk_articulo_venta PRIMARY KEY(articulo_venta_id),
CONSTRAINT fk_articulo_venta1 FOREIGN KEY(articulo_id) REFERENCES articulo(articulo_id),
CONSTRAINT fk_articulo_venta2 FOREIGN KEY(venta_id) REFERENCES venta(venta_id)
);


-- TRIGGERS ----------------------------------------------------------------------------------
-- Actualizar STOCK y ventas -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_venta()
RETURNS TRIGGER AS $$
DECLARE
    precio_unitario numeric(20,2);
    stock_actual numeric;
BEGIN
    -- Obtener precio del artículo
    SELECT precio_venta, stock INTO precio_unitario, stock_actual
    FROM articulo
    WHERE articulo_id = NEW.articulo_id;

    -- Validar disponibilidad
    IF stock_actual IS NULL OR stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'No disponible: stock insuficiente para el artículo %', NEW.articulo_id;
    END IF;

    -- Calcular monto_por_articulo y asignarlo
    NEW.monto_por_articulo := precio_unitario * NEW.cantidad;

    -- Actualizar stock del artículo
    UPDATE articulo
    SET stock = stock - NEW.cantidad
    WHERE articulo_id = NEW.articulo_id;

    -- Actualizar totales en la venta
    UPDATE venta
    SET
        monto_total = monto_total + NEW.monto_por_articulo,
        cantidad_articulos = cantidad_articulos + NEW.cantidad
    WHERE venta_id = NEW.venta_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Crear trigger:
CREATE TRIGGER trg_actualizar_venta
BEFORE INSERT ON articulo_venta
FOR EACH ROW
EXECUTE FUNCTION actualizar_venta();


-- Validar misma sucursal entre empleados.--------------------------------------------------
CREATE OR REPLACE FUNCTION validar_sucursal_empleados()
RETURNS TRIGGER AS $$
DECLARE
    sucursal_vendedor numeric;
    sucursal_cobrador numeric;
BEGIN
    -- Obtener la sucursal vendedor
    SELECT sucursal_id INTO sucursal_vendedor
    FROM empleado
    WHERE empleado_id = NEW.empleado_vendedor_id;

    -- Obtener la sucursal cobrador
    SELECT sucursal_id INTO sucursal_cobrador
    FROM empleado
    WHERE empleado_id = NEW.empleado_cobrador_id;

    -- Validar que ambas coincidan
    IF sucursal_vendedor IS NULL OR sucursal_cobrador IS NULL THEN
        RAISE EXCEPTION 'Empleado no encontrado. Verifica los IDs de vendedor y/o cobrador.';
    END IF;

    IF sucursal_vendedor <> sucursal_cobrador THEN
        RAISE EXCEPTION 'El vendedor y el cobrador no pertenecen a la misma sucursal.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Crear el trigger------------------------------------------------------------------------------
CREATE TRIGGER trg_validar_empleados_sucursal
BEFORE INSERT ON venta
FOR EACH ROW
EXECUTE FUNCTION validar_sucursal_empleados();


--Generar folio de venta ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generar_folio_venta()
RETURNS TRIGGER AS $$
DECLARE
    folio_count INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO folio_count FROM venta;

    NEW.folio := 'MBL-' || LPAD(folio_count::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_folio
BEFORE INSERT ON venta
FOR EACH ROW
EXECUTE FUNCTION generar_folio_venta();


--Generar razón social por defecto----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_razon_social_cliente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.razon_social IS NULL THEN
        NEW.razon_social := NEW.nombre || ' ' || NEW.ap_paterno || 
            COALESCE(' ' || NEW.ap_materno, '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Creamos el trigger-----------------------------------------------------------------------------
CREATE TRIGGER trg_set_razon_social
BEFORE INSERT ON cliente
FOR EACH ROW
EXECUTE FUNCTION set_razon_social_cliente();

--------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------

--Funciones----------------------------------------------------------------------------------
--Obtener jerarquia de un empleado-----------------------------------------------------------------
CREATE OR REPLACE FUNCTION obtener_jerarquia_empleado(
    p_nombre VARCHAR,
    p_ap_paterno VARCHAR,
    p_ap_materno VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    empleado_id NUMERIC,
    nombre_completo TEXT,
    tipo_empleado VARCHAR,
    nivel INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE jerarquia AS (
        -- Se busca el nombre del empleado ingresado.
        SELECT
            e.empleado_id,
            e.nombre || ' ' || e.ap_paterno || ' ' || COALESCE(e.ap_materno, '') AS nombre_completo,
            e.tipo_empleado,
            e.supervisor_id,
            1 AS nivel,
            ARRAY[e.empleado_id]::numeric(10,0)[] AS path_ids  
        FROM empleado e
        WHERE
            lower(e.nombre) = lower(p_nombre) AND
            lower(e.ap_paterno) = lower(p_ap_paterno) AND
            (
                p_ap_materno IS NULL AND e.ap_materno IS NULL OR
                lower(e.ap_materno) = lower(p_ap_materno)
            )

        UNION ALL

        -- Se busca su supervisor de forma recursiva.
        SELECT
            e.empleado_id,
            e.nombre || ' ' || e.ap_paterno || ' ' || COALESCE(e.ap_materno, '') AS nombre_completo,
            e.tipo_empleado,
            e.supervisor_id,
            j.nivel + 1,
            (j.path_ids || e.empleado_id)::numeric(10,0)[] 
        FROM empleado e
        JOIN jerarquia j ON e.empleado_id = j.supervisor_id
        WHERE NOT e.empleado_id = ANY(j.path_ids)
    )
    SELECT j.empleado_id, j.nombre_completo, j.tipo_empleado, j.nivel
    FROM jerarquia j
    ORDER BY j.nivel;
END;
$$ LANGUAGE plpgsql;

--Ejemplo de uso: SELECT * FROM obtener_jerarquia_empleado('Angel', 'Pérez', 'López');


--------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------


--VISTAS------------------------------------------------------------------------------------------
--Vista Ticket de venta --------------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_ticket_venta AS
SELECT
    v.folio,
    v.fecha_venta,
    COALESCE(c.nombre, 'Público general') AS cliente_nombre,
    a.nombre AS articulo_nombre,
    av.cantidad,
    a.precio_venta,
    av.cantidad * a.precio_venta AS subtotal,
    SUM(av.cantidad * a.precio_venta) OVER (PARTITION BY v.venta_id) AS total_venta
FROM venta v
JOIN articulo_venta av ON v.venta_id = av.venta_id
JOIN articulo a ON a.articulo_id = av.articulo_id
LEFT JOIN cliente c ON c.cliente_id = v.cliente_id;


--Ejemplo de uso: SELECT * FROM vista_ticket_venta WHERE folio = 'MBL-001';


--Vista articulos con poco Stock------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_articulos_criticos AS
SELECT 
    articulo_id,
    cod_barras,
    nombre,
    stock AS cantidad_disponible,
    CASE
        WHEN stock = 0 THEN 'No disponible'
        ELSE 'Stock crítico'
    END AS estado
FROM articulo
WHERE stock <= 3;

--Ejemplo de uso: select * from vista_articulos_criticos;

--------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------


--INDICES-----------------------------------------------------------------------------------------
--Índice sobre articulo_venta.articulo_id --------------------------------------------------------
-- Ver las ventas en las que aparece un artículo específico
CREATE INDEX idx_articulo_venta_articulo_id
ON articulo_venta (articulo_id);

--Ejemplo de uso, ver todas las ventas que inclut¿yan al articulo con id 402.
SELECT av.venta_id, av.cantidad, a.nombre
FROM articulo_venta av
JOIN articulo a ON a.articulo_id = av.articulo_id
WHERE av.articulo_id = 402;


-- Índice sobre venta.fecha_venta -----------------------------------------------------------------
CREATE INDEX idx_venta_fecha_venta
ON venta (fecha_venta);

-- Ejemplo: Ver todas las ventas realizadas en mayo de 2025
SELECT * FROM venta
WHERE fecha_venta BETWEEN '2025-05-01' AND '2025-05-31';


--Índice sobre articulo.cod_barras -----------------------------------------------------------------
CREATE INDEX idx_articulo_cod_barras
ON articulo (cod_barras);

-- jemplo: Buscar artículo por código de barras
SELECT nombre, precio_venta, stock
FROM articulo
WHERE cod_barras = 'BARRAS002';



--Vrer índices existentes: SELECT * FROM pg_indexes WHERE tablename = 'venta';

------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------




