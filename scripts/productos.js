// Importamos nuestras herramientas
import { obtenerProductos, crearProducto, actualizarProducto, borrarProducto } from '../api/productosAPI.js';
import { mostrarAlerta } from '../utils/alertas.js';

let productosGlobales = [];
let modoEdicion = false; 

document.addEventListener('DOMContentLoaded', () => {
    cargarTabla();

    // 1. Buscador Optimizado
    document.getElementById('buscadorProductos').addEventListener('input', (e) => {
        const texto = e.target.value.toLowerCase();
        const filtrados = productosGlobales.filter(p => 
            p.Nombre.toLowerCase().includes(texto) || 
            (p.CodigoBarras && p.CodigoBarras.toLowerCase().includes(texto))
        );
        renderizarTabla(filtrados);
    });

    // 2. Controladores del Modal
    const modal = document.getElementById('modalProducto');
    const form = document.getElementById('formularioProducto');

    document.getElementById('btnAgregarProducto').addEventListener('click', () => {
        modoEdicion = false;
        document.getElementById('tituloModal').textContent = 'Nuevo Producto 📦';
        form.reset(); 
        document.getElementById('productoId').value = '';
        modal.classList.remove('oculto');
    });

    document.getElementById('btnCerrarModal').addEventListener('click', () => modal.classList.add('oculto'));
    document.getElementById('btnCancelarModal').addEventListener('click', () => modal.classList.add('oculto'));

    // 3. Guardar / Actualizar
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const datosProducto = {
            CodigoBarras: document.getElementById('codigoBarras').value || null,
            ProductoN: document.getElementById('nombreProducto').value,
            Precio: parseFloat(document.getElementById('precio').value),
            Stock: parseInt(document.getElementById('stock').value),
            idCategoria: parseInt(document.getElementById('idCategoria').value),
            idMarca: parseInt(document.getElementById('idMarca').value),
            idUnidad: 1, 
            StockMinimo: 5,
            PrecioProveedor: 0,
            idProveedor: 1
        };

        const idActual = document.getElementById('productoId').value;
        
        // Llamadas limpias a la API
        const respuesta = modoEdicion 
            ? await actualizarProducto(idActual, datosProducto)
            : await crearProducto(datosProducto);

        if (respuesta.exito) {
            modal.classList.add('oculto');
            cargarTabla(); 
            mostrarAlerta(modoEdicion ? '¡Producto actualizado! ✨' : '¡Producto guardado! 📦');
        } else {
            mostrarAlerta('Error: ' + respuesta.mensaje);
        }
    });
});

// ================= FUNCIONES =================

async function cargarTabla() {
    productosGlobales = await obtenerProductos();
    renderizarTabla(productosGlobales);
}

function renderizarTabla(lista) {
    const tbody = document.getElementById('cuerpoTablaProductos');
    tbody.innerHTML = '';
    
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay productos disponibles.</td></tr>`;
        return;
    }

    lista.forEach(prod => {
        if (prod.Estatus === 'Inactivo') return; 

        const claseStock = parseFloat(prod.Stock) <= 5 ? 'badge-stock bajo' : 'badge-stock';
        
        // Creamos la fila
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prod.CodigoBarras || 'N/A'}</td>
            <td><strong>${prod.Nombre}</strong></td>
            <td>${prod.NombreCategoria || 'Sin categoría'}</td>
            <td style="color: #4facfe;">$${parseFloat(prod.Precio).toFixed(2)}</td>
            <td><span class="${claseStock}">${prod.Stock}</span></td>
            <td>${prod.Estatus}</td>
            <td>
                <button class="btn-icon btn-editar" data-id="${prod.IdProducto}">✏️</button>
                <button class="btn-icon btn-borrar" data-id="${prod.IdProducto}">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Asignar eventos a los botones generados dinámicamente
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => editarProducto(parseInt(e.target.dataset.id)));
    });

    document.querySelectorAll('.btn-borrar').forEach(btn => {
        btn.addEventListener('click', (e) => eliminarProducto(parseInt(e.target.dataset.id)));
    });
}

function editarProducto(id) {
    const prod = productosGlobales.find(p => p.IdProducto === id);
    if (!prod) return;

    modoEdicion = true;
    document.getElementById('tituloModal').textContent = 'Editar Producto ✏️';
    
    document.getElementById('productoId').value = prod.IdProducto;
    document.getElementById('codigoBarras').value = prod.CodigoBarras || '';
    document.getElementById('nombreProducto').value = prod.Nombre;
    document.getElementById('precio').value = prod.Precio;
    document.getElementById('stock').value = prod.Stock;
    // OJO: Aquí deberías llenar también idCategoria e idMarca si los tienes en la tabla
    
    document.getElementById('modalProducto').classList.remove('oculto');
}

async function eliminarProducto(id) {
    if (confirm('¿Dar de baja este producto? (Ya no aparecerá en ventas)')) {
        const respuesta = await borrarProducto(id);
        if (respuesta.exito) {
            mostrarAlerta('Producto eliminado correctamente 🗑️');
            cargarTabla(); 
        } else {
            mostrarAlerta('No se pudo borrar el producto.');
        }
    }
}