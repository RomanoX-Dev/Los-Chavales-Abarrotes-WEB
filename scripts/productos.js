// 1. IMPORTACIONES
import { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    eliminarProductoDefinitivoAPI 
} from '../api/productosAPI.js';
import { obtenerCategoriasAPI } from '../api/categoriasAPI.js';
import { obtenerMarcasAPI } from '../api/marcasAPI.js';
import { obtenerProveedoresAPI } from '../api/proveedoresAPI.js';
import { mostrarAlerta } from '../utils/alertas.js';
import { renderizarTablaProductos } from '../components/productosT.js';
import { IMGBB_API_KEY, IMAGEN_DEFAULT, resolverUrlImagen } from '../utils/helpers.js';

// 2. ESTADO GLOBAL Y AUXILIARES DOM
let productosGlobales = [];

const getElem = (id) => document.getElementById(id);
const getVal = (id) => getElem(id)?.value?.trim() || '';

// 3. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    // Carga inicial de datos de la tabla y desplegables
    await Promise.all([cargarTabla(), cargarCombos()]);

    const modal = getElem('modalProducto');
    const form = getElem('formularioProducto');
    const previewImagen = getElem('previewImagen');
    const inputArchivo = getElem('imagenProductoFile');
    const nombreArchivoText = getElem('nombreArchivoText');
    const btnQuitarFoto = getElem('btnQuitarFoto');

    // -----------------------------------------------------------
    // BUSCADOR EN TIEMPO REAL
    // -----------------------------------------------------------
    getElem('buscadorProductos')?.addEventListener('input', (e) => {
        const texto = e.target.value.toLowerCase().trim();
        const filtrados = productosGlobales.filter(p => {
            const nombre = (p.ProductoN || p.Nombre || p.nombre || '').toLowerCase();
            const codigo = (p.CodigoBarras || p.codigo || '').toLowerCase();
            return nombre.includes(texto) || codigo.includes(texto);
        });
        actualizarUI(filtrados);
    });

    // -----------------------------------------------------------
    // ABRIR MODAL PARA CREAR
    // -----------------------------------------------------------
    getElem('btnAgregarProducto')?.addEventListener('click', () => {
        if (getElem('tituloModal')) getElem('tituloModal').textContent = 'Nuevo Producto 📦';
        if (form) form.reset(); 
        
        if (getElem('productoId')) getElem('productoId').value = '';
        if (inputArchivo) inputArchivo.value = '';
        
        const selectEstatus = getElem('estatusProducto');
        if (selectEstatus) selectEstatus.value = 'Activo';

        if (previewImagen) previewImagen.src = IMAGEN_DEFAULT;
        if (nombreArchivoText) nombreArchivoText.textContent = 'Ningún archivo seleccionado';
        
        limpiarDatasetImagen(inputArchivo);
        modal?.classList.remove('oculto');
    });

    // -----------------------------------------------------------
    // CERRAR MODAL
    // -----------------------------------------------------------
    const cerrarModal = () => {
        modal?.classList.add('oculto');
        if (form) form.reset();
        if (inputArchivo) {
            inputArchivo.value = '';
            limpiarDatasetImagen(inputArchivo);
        }
    };

    getElem('btnCerrarModal')?.addEventListener('click', cerrarModal);
    getElem('btnCerrarModalInferior')?.addEventListener('click', cerrarModal);

    // -----------------------------------------------------------
    // REMOVER FOTO
    // -----------------------------------------------------------
    btnQuitarFoto?.addEventListener('click', () => {
        if (inputArchivo) {
            inputArchivo.value = '';
            inputArchivo.dataset.eliminarFoto = 'true';
        }
        if (previewImagen) previewImagen.src = IMAGEN_DEFAULT;
        if (nombreArchivoText) nombreArchivoText.textContent = 'Foto removida';
        mostrarAlerta('Foto marcada para eliminación al guardar 🗑️');
    });

    // -----------------------------------------------------------
    // PREVISUALIZAR IMAGEN
    // -----------------------------------------------------------
    inputArchivo?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (inputArchivo) inputArchivo.dataset.eliminarFoto = 'false';

        if (file) {
            if (nombreArchivoText) nombreArchivoText.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (evento) => {
                if (previewImagen) previewImagen.src = evento.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            const urlPrevia = inputArchivo?.dataset.urlActual;
            if (previewImagen) previewImagen.src = resolverUrlImagen(urlPrevia);
            if (nombreArchivoText) {
                nombreArchivoText.textContent = urlPrevia ? 'Manteniendo imagen previa' : 'Ningún archivo seleccionado';
            }
        }
    });

    // -----------------------------------------------------------
    // GUARDAR (CREAR O EDITAR)
    // -----------------------------------------------------------
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const idActual = getVal('productoId');
        const esEdicion = Boolean(idActual);

        const codigoIngresado = getVal('codigoBarras');
        const nombreIngresado = getVal('nombreProducto').toLowerCase();

        // Validar duplicados
        const duplicado = productosGlobales.find(p => {
            const idProd = String(p.IdProducto || p.idProducto || p.id || '');
            if (esEdicion && idProd === String(idActual)) return false;

            const pCodigo = (p.CodigoBarras || p.codigo || '').trim();
            const pNombre = (p.ProductoN || p.Nombre || p.nombre || '').trim().toLowerCase();

            const coincideCodigo = codigoIngresado && pCodigo && pCodigo === codigoIngresado;
            const coincideNombre = nombreIngresado && pNombre && pNombre === nombreIngresado;

            return coincideCodigo || coincideNombre;
        });

        if (duplicado) {
            mostrarAlerta('⚠️ Ya existe otro producto con este Nombre o Código de Barras.');
            return;
        }

        mostrarAlerta('Procesando datos e imagen... ⏳');

        let urlImagenFinal = inputArchivo?.dataset.urlActual || null;
        let deleteHashFinal = inputArchivo?.dataset.deleteHashActual || null;
        let deleteUrlFinal = inputArchivo?.dataset.deleteUrlActual || null;

        const seQuitoFoto = inputArchivo?.dataset.eliminarFoto === 'true';
        const hayNuevaFoto = inputArchivo?.files && inputArchivo.files[0];

        if ((seQuitoFoto || hayNuevaFoto) && deleteUrlFinal) {
            try {
                await fetch(deleteUrlFinal, { method: 'GET', mode: 'no-cors' });
            } catch (err) {
                console.warn('No se eliminó la imagen antigua en ImgBB:', err);
            }
        }

        if (seQuitoFoto) {
            urlImagenFinal = null;
            deleteHashFinal = null;
            deleteUrlFinal = null;
        }

        if (hayNuevaFoto) {
            const formData = new FormData();
            formData.append('image', inputArchivo.files[0]);

            try {
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                const dataUpload = await res.json();

                if (dataUpload.success) {
                    urlImagenFinal = dataUpload.data.url;
                    deleteHashFinal = dataUpload.data.deletehash || null;
                    deleteUrlFinal = dataUpload.data.delete_url || null;
                } else {
                    mostrarAlerta('Error al subir la imagen.');
                    return;
                }
            } catch (err) {
                mostrarAlerta('Error de red al subir la imagen.');
                return;
            }
        }

        const estatusSeleccionado = getVal('estatusProducto') || 'Activo';
        const precioNum = parseFloat(getVal('precio')) || 0;
        const stockNum = parseInt(getVal('stock'), 10) || 0;
        const catId = parseInt(getVal('idCategoria'), 10) || null;
        const marcaId = parseInt(getVal('idMarca'), 10) || null;
        const provId = parseInt(getVal('idProveedor'), 10) || 1;
        const descrip = getVal('descripcionProducto') || null;
        const precioProvNum = parseFloat(getVal('precioProveedor')) || 0;
        const stockMinNum = parseInt(getVal('stockMinimo'), 10) || 0;

        // Estructura de datos unificada
        const datosProducto = {
            // PascalCase
            CodigoBarras: codigoIngresado || null,
            ProductoN: getVal('nombreProducto'),
            Nombre: getVal('nombreProducto'),
            Descripcion: descrip,
            Precio: precioNum,
            PrecioProveedor: precioProvNum,
            Stock: stockNum,
            StockMinimo: stockMinNum,
            idCategoria: catId,
            idMarca: marcaId,
            idProveedor: provId,
            Estatus: estatusSeleccionado,
            Activo: estatusSeleccionado === 'Activo',
            Imagen: urlImagenFinal,
            DeleteHash: deleteHashFinal,
            DeleteUrl: deleteUrlFinal,
            idUnidad: 1,

            // camelCase
            codigo: codigoIngresado || null,
            nombre: getVal('nombreProducto'),
            descripcion: descrip,
            precio: precioNum,
            precioProveedor: precioProvNum,
            stock: stockNum,
            stockMinimo: stockMinNum,
            estatus: estatusSeleccionado,
            activo: estatusSeleccionado === 'Activo' ? 1 : 0,
            imagen: urlImagenFinal,
            deleteHash: deleteHashFinal,
            deleteUrl: deleteUrlFinal
        };

        const respuesta = esEdicion 
            ? await actualizarProducto(idActual, datosProducto)
            : await crearProducto(datosProducto);

        if (respuesta.exito) {
            cerrarModal();
            await cargarTabla();
            mostrarAlerta(respuesta.mensaje || (esEdicion ? '¡Producto actualizado! ✨' : '¡Producto guardado! 📦'));
        } else {
            mostrarAlerta('Error: ' + respuesta.mensaje);
        }
    });
});

// 4. FUNCIONES DE CARGA Y RENDERIZADO DE DATOS
async function cargarTabla() {
    productosGlobales = await obtenerProductos();
    actualizarUI(productosGlobales);
}

async function cargarCombos() {
    try {
        const [categorias, marcas, proveedores] = await Promise.all([
            obtenerCategoriasAPI(),
            obtenerMarcasAPI(),
            obtenerProveedoresAPI()
        ]);

        poblarSelect('idCategoria', categorias, 'Seleccione categoría...', 'idCategoria', 'NombreCategoria');
        poblarSelect('idMarca', marcas, 'Seleccione marca...', 'idMarca', 'NombreMarca');
       poblarSelect('idProveedor', proveedores, 'Seleccione proveedor...', 'idProveedor', 'NombreEmpresa');
    } catch (error) {
        console.error('Error al cargar los combos:', error);
    }
}

function poblarSelect(selectId, elementos, textoDefecto, campoId, campoNombre) {
    const select = getElem(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">${textoDefecto}</option>`;
    elementos.forEach(item => {
        const id = item[campoId] || item[campoId.toLowerCase()] || item.Id || item.id;
        const nombre = item[campoNombre] || item[campoNombre.toLowerCase()] || item.Nombre || item.nombre || item.RazonSocial || item.razonSocial;
        
        if (id && nombre) {
            select.innerHTML += `<option value="${id}">${nombre}</option>`;
        }
    });
}

function actualizarUI(lista) {
    const tbody = getElem('cuerpoTablaProductos');
    renderizarTablaProductos(lista, tbody, {
        onEditar: editarProducto,
        onBorrarDefinitivo: borrarFisicoDefinitivo
    });
}

// 5. EDICIÓN Y ELIMINACIÓN
function editarProducto(id) {
    const prod = productosGlobales.find(p => String(p.IdProducto || p.idProducto || p.id) === String(id));
    if (!prod) return;

    if (getElem('tituloModal')) getElem('tituloModal').textContent = 'Editar Producto ✏️';

    setInputValue('productoId', prod.IdProducto || prod.idProducto || prod.id);
    setInputValue('codigoBarras', prod.CodigoBarras || prod.codigo);
    setInputValue('nombreProducto', prod.ProductoN || prod.Nombre || prod.nombre);
    setInputValue('descripcionProducto', prod.Descripcion || prod.descripcion);
    
    setInputValue('precio', prod.Precio ?? prod.precio);
    setInputValue('precioProveedor', prod.PrecioProveedor ?? prod.precioProveedor);
    setInputValue('stock', prod.Stock ?? prod.stock);
    setInputValue('stockMinimo', prod.StockMinimo ?? prod.stockMinimo);

    setSelectValue('idCategoria', prod.idCategoria || prod.IdCategoria);
    setSelectValue('idMarca', prod.idMarca || prod.IdMarca);
    setSelectValue('idProveedor', prod.idProveedor || prod.IdProveedor);

    const selectEstatus = getElem('estatusProducto');
    if (selectEstatus) {
        const estatusActual = prod.Estatus || prod.estatus || (prod.Activo === false || prod.activo === 0 ? 'Inactivo' : 'Activo');
        selectEstatus.value = estatusActual;
    }

    const imagenBD = prod.Imagen || prod.imagen || prod.urlImagen;
    const urlImagenActual = resolverUrlImagen(imagenBD);

    const previewImagen = getElem('previewImagen');
    if (previewImagen) previewImagen.src = urlImagenActual;

    const nombreText = getElem('nombreArchivoText');
    if (nombreText) {
        nombreText.textContent = (urlImagenActual !== IMAGEN_DEFAULT) ? 'Imagen cargada ☁️' : 'Sin imagen asignada';
    }

    const inputArchivo = getElem('imagenProductoFile');
    if (inputArchivo) {
        inputArchivo.value = '';
        inputArchivo.dataset.urlActual = (urlImagenActual !== IMAGEN_DEFAULT) ? urlImagenActual : '';
        inputArchivo.dataset.deleteHashActual = prod.DeleteHash || prod.deleteHash || '';
        inputArchivo.dataset.deleteUrlActual = prod.DeleteUrl || prod.deleteUrl || '';
        inputArchivo.dataset.eliminarFoto = 'false';
    }

    getElem('modalProducto')?.classList.remove('oculto');
}

async function borrarFisicoDefinitivo(id) {
    if (!confirm('⚠️ ¿Confirmas la eliminación permanente de este producto?')) return;

    mostrarAlerta('Eliminando permanentemente... ⏳');
    const respuesta = await eliminarProductoDefinitivoAPI(id);

    if (respuesta.exito) {
        await cargarTabla();
        mostrarAlerta(respuesta.mensaje || 'Producto eliminado.');
    } else {
        mostrarAlerta('Error: ' + respuesta.mensaje);
    }
}

// 6. HELPER FUNCTIONS
function setInputValue(elemId, valor) {
    const elem = getElem(elemId);
    if (elem) {
        elem.value = (valor !== null && valor !== undefined) ? valor : '';
    }
}

function setSelectValue(elemId, valor) {
    const elem = getElem(elemId);
    if (elem) {
        elem.value = valor || '';
    }
}

function limpiarDatasetImagen(elem) {
    if (!elem) return;
    elem.dataset.urlActual = '';
    elem.dataset.deleteHashActual = '';
    elem.dataset.deleteUrlActual = '';
    elem.dataset.eliminarFoto = 'false';
}