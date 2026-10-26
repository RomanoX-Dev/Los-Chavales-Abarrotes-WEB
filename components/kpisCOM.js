/* ==========================================================================
   KPISCOM.JS - INDICADORES OPERATIVOS DEL MENÚ (ventas del día y estado de caja)
   ========================================================================== */
import { obtenerCorteActivo } from '../api/cortesCajaAPI.js';
import { obtenerHistorialVentas } from '../api/posAPI.js';
import { tieneRol, formatearMoneda, hoyLocalStr, inicioDelDiaISO, finDelDiaISO } from '../utils/helpers.js';

export async function cargarKPIsOperativos() {
    const elVentas = document.getElementById('kpiVentas');
    const elCorte = document.getElementById('kpiCorteEstado');

    // El Almacenista no vende ni tiene caja
    if (!tieneRol('Administrador', 'Gerente', 'Vendedor')) {
        if (elVentas) elVentas.textContent = '—';
        if (elCorte) elCorte.textContent = '—';
        return;
    }

    const hoy = hoyLocalStr();
    const [ventas, corte] = await Promise.all([
        obtenerHistorialVentas({ desde: inicioDelDiaISO(hoy), hasta: finDelDiaISO(hoy), limite: 500 }),
        obtenerCorteActivo()
    ]);

    if (elVentas) {
        if (ventas.exito) {
            // Vendedor: sus ventas. Administrador/Gerente: las de todos.
            const total = ventas.datos
                .filter(v => v.estatus === 'Completada')
                .reduce((acc, v) => acc + Number(v.total), 0);
            elVentas.textContent = formatearMoneda(total);
        } else {
            elVentas.textContent = '—';
        }
    }

    if (elCorte) {
        elCorte.textContent = !corte.exito ? '—' : (corte.datos ? 'Abierto' : 'Cerrado');
    }
}