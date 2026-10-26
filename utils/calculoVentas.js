/* ==========================================================================
   CALCULOVENTAS.JS - MONTOS DE UNA VENTA (FRONT)
   la vista previa del ticket coincide con lo que cobra el servidor.
   Los precios de inventario YA incluyen IVA.
   ========================================================================== */

export const IVA_TASA = 0.16; // igual que IVA_TASA del backend
export const ENVIO_MAX = 500;
// El servidor valida de nuevo por rol.
export const DESCUENTO_MAX_POR_ROL = { Vendedor: 10, Gerente: 50, Administrador: 50 };

const aCentavos = (n) => Math.round(Number(n) * 100);
const aPesos = (c) => c / 100;

export function calcularMontos({ lineas, descuentoPorcentaje = 0, costoEnvio = 0, ivaTasa = IVA_TASA }) {
    const brutoC = lineas.reduce(
        (acc, l) => acc + Math.round(aCentavos(l.precio) * Number(l.cantidad)), 0
    );
    const descuentoBrutoC = Math.round(brutoC * Number(descuentoPorcentaje) / 100);
    const totalProductosC = brutoC - descuentoBrutoC;

    const baseC = Math.round(totalProductosC / (1 + ivaTasa));
    const ivaC = totalProductosC - baseC;
    const descuentoSinIvaC = Math.round(descuentoBrutoC / (1 + ivaTasa));
    const envioC = aCentavos(costoEnvio);

    return {
        subtotal: aPesos(baseC + descuentoSinIvaC),
        descuento: aPesos(descuentoSinIvaC),
        iva: aPesos(ivaC),
        costoEnvio: aPesos(envioC),
        total: aPesos(totalProductosC + envioC)
    };
}