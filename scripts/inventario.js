import { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    eliminarProductoDefinitivoAPI 
} from '../api/inventarioAPI.js';
import { obtenerCategoriasAPI } from '../api/categoriasAPI.js';
import { obtenerMarcasAPI } from '../api/marcasAPI.js';
import { obtenerUnidadesAPI } from '../api/unidadesMedidaAPI.js'; 
import { mostrarExito, mostrarError, mostrarAdvertencia, mostrarConfirmacion } from '../utils/alertas.js';
import { renderizarTablaInventario } from '../components/inventarioCOM.js';
import { IMGBB_API_KEY, IMAGEN_DEFAULT, resolverUrlImagen } from '../utils/helpers.js';

let productosGlobales = [];

const getElem = (id) => document.getElementById(id);
const getVal = (id) => getElem(id)?.value?.trim() || '';

document.addEventListener('DOMContentLoaded', async () => {
    await cargarModalProducto();
    await Promise.all([cargarTabla(), cargarCombos()]);

    const modal = getElem('modalProducto');
    const form = getElem('formularioProducto');
    const previewImagen = getElem('previewImagen');
    const inputArchivo = getElem('imagenProductoFile');
    const nombreArchivoText = getElem('nombreArchivoText');
    const btnQuitarFoto = getElem('btnQuitarFoto');

    getElem('buscadorProductos')?.addEventListener('input', (e) => {
        const texto = e.target.value.toLowerCase().trim();
        const filtrados = productosGlobales.filter(p => {
            const nombre = (p.nombre || p.nombreProducto || '').toLowerCase();
            const codigo = (p.codigoBarras || '').toLowerCase();
            return nombre.includes(texto) || codigo.includes(texto);
        });
        actualizarUI(filtrados);
    });

    getElem('btnAgregarProducto')?.addEventListener('click', () => {
        if (getElem('tituloModal')) getElem('tituloModal').textContent = 'Nuevo Producto 📦';
        if (form) form.reset(); 
        
        setInputValue('productoId', '');
        if (inputArchivo) inputArchivo.value = '';
        setSelectValue('estatusProducto', 'Activo');

        if (previewImagen) previewImagen.src = IMAGEN_DEFAULT;
        if (nombreArchivoText) nombreArchivoText.textContent = 'Ningún archivo seleccionado';
        
        limpiarDatasetImagen(inputArchivo);
        modal?.classList.remove('oculto');
    });

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

    btnQuitarFoto?.addEventListener('click', () => {
        if (inputArchivo) {
            inputArchivo.value = '';
            inputArchivo.dataset.eliminarFoto = 'true';
        }
        if (previewImagen) previewImagen.src = IMAGEN_DEFAULT;
        if (nombreArchivoText) nombreArchivoText.textContent = 'Foto removida';
        mostrarAdvertencia('Foto marcada para eliminación al guardar 🗑️');
    });

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

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const idActual = getVal('productoId');
        const esEdicion = Boolean(idActual);
        const codigoIngresado = getVal('codigoBarras');
        const nombreIngresado = getVal('nombreProducto');

        const datosTemporal = {
            nombreProducto: nombreIngresado,
            codigoBarras: codigoIngresado,
            precio: parseFloat(getVal('precio')),
            stock: parseFloat(getVal('stock')) || 0,
            stockMinimo: parseFloat(getVal('stockMinimo')) || 0,
            idCategoria: parseInt(getVal('idCategoria'), 10) || null,
            idMarca: parseInt(getVal('idMarca'), 10) || null,
            idUnidad: parseInt(getVal('idUnidad'), 10) || null
        };

        if (!validarDatosProducto(datosTemporal)) return;

        const duplicado = productosGlobales.find(p => {
            const idProd = String(p.idProducto || '');
            if (esEdicion && idProd === String(idActual)) return false;

            const pCodigo = (p.codigoBarras || '').trim();
            const pNombre = (p.nombre || p.nombreProducto || '').trim().toLowerCase();

            return (pCodigo === codigoIngresado) || (pNombre === nombreIngresado.toLowerCase());
        });

        if (duplicado) {
            mostrarAdvertencia('Ya existe otro producto con este Nombre o Código de Barras');
            return;
        }

        mostrarAdvertencia('Procesando datos e imagen... ⏳');

        let urlImagenFinal = inputArchivo?.dataset.urlActual || null;
        let deleteHashFinal = inputArchivo?.dataset.deleteHashActual || null;
        let deleteUrlFinal = inputArchivo?.dataset.deleteUrlActual || null;

        const seQuitoFoto = inputArchivo?.dataset.eliminarFoto === 'true';
        const hayNuevaFoto = inputArchivo?.files && inputArchivo.files[0];

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
                    mostrarError('Error al subir la imagen.');
                    return;
                }
            } catch (err) {
                mostrarError('Error de red al subir la imagen.');
                return;
            }
        }

        const datosProducto = {
            nombreProducto: getVal('nombreProducto'),
            codigoBarras: codigoIngresado || null,
            descripcion: getVal('descripcionProducto') || null,
            precio: parseFloat(getVal('precio')) || 0,
            stock: parseFloat(getVal('stock')) || 0,
            stockMinimo: parseFloat(getVal('stockMinimo')) || 0,
            idCategoria: parseInt(getVal('idCategoria'), 10) || null,
            idMarca: parseInt(getVal('idMarca'), 10) || null,
            idUnidad: parseInt(getVal('idUnidad'), 10) || null,
            estatus: getVal('estatusProducto') || 'Activo',
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
            mostrarExito(respuesta.mensaje || (esEdicion ? '¡Producto actualizado! ✨' : '¡Producto guardado! 📦'));
        } else {
            mostrarError('Error: ' + respuesta.mensaje);
        }
    });
});

async function cargarModalProducto() {
    const contenedor = document.getElementById('contenedorModalProducto');
    if (!contenedor) return;
    try {
        const respuesta = await fetch('../cards/Tarjetainventario.html');
        const html = await respuesta.text();
        contenedor.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar la tarjeta:', error);
    }
}

async function cargarTabla() {
    productosGlobales = await obtenerProductos();
    actualizarUI(productosGlobales);
}

async function cargarCombos() {
    try {
        const [categorias, marcas, unidades] = await Promise.all([
            obtenerCategoriasAPI(),
            obtenerMarcasAPI(),
            obtenerUnidadesAPI()
        ]);

        poblarSelect('idCategoria', categorias, 'Seleccione categoría...', 'idCategoria', 'nombreCategoria');
        poblarSelect('idMarca', marcas, 'Seleccione marca...', 'idMarca', 'nombreMarca');
        poblarSelect('idUnidad', unidades, 'Seleccione unidad...', 'idUnidad', 'nombreUnidad');
    } catch (error) {
        console.error('Error al cargar combos:', error);
    }
}

function poblarSelect(selectId, elementos, textoDefecto, campoId, campoNombre) {
    const select = getElem(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">${textoDefecto}</option>`;
    elementos.forEach(item => {
        const id = item[campoId];
        const nombre = item[campoNombre];
        if (id && nombre) {
            select.innerHTML += `<option value="${id}">${nombre}</option>`;
        }
    });
}

function actualizarUI(lista) {
    const tbody = getElem('cuerpoTablaProductos');
    renderizarTablaInventario(lista, tbody, {
        onEditar: editarProducto,
        onBorrarDefinitivo: borrarFisicoDefinitivo
    });
}

function editarProducto(id) {
    const prod = productosGlobales.find(p => String(p.idProducto) === String(id));
    if (!prod) return;

    if (getElem('tituloModal')) getElem('tituloModal').textContent = 'Editar Producto ✏️';

    setInputValue('productoId', prod.idProducto);
    setInputValue('codigoBarras', prod.codigoBarras);
    setInputValue('nombreProducto', prod.nombre || prod.nombreProducto);
    setInputValue('descripcionProducto', prod.descripcion);
    setInputValue('precio', prod.precio);
    setInputValue('stock', prod.stock);
    setInputValue('stockMinimo', prod.stockMinimo);

    setSelectValue('idCategoria', prod.idCategoria);
    setSelectValue('idMarca', prod.idMarca);
    setSelectValue('idUnidad', prod.idUnidad);
    setSelectValue('estatusProducto', prod.estatus || 'Activo');

    const urlImagenActual = resolverUrlImagen(prod.imagen);
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
        inputArchivo.dataset.deleteHashActual = prod.deleteHash || '';
        inputArchivo.dataset.deleteUrlActual = prod.deleteUrl || '';
        inputArchivo.dataset.eliminarFoto = 'false';
    }

    getElem('modalProducto')?.classList.remove('oculto');
}

// Eliminación con confirmación dinámica y pantalla bloqueada
async function borrarFisicoDefinitivo(id) {
    const confirmado = await mostrarConfirmacion('¿Deseas eliminar permanentemente este producto?, Esta acción no se puede deshacer.');
    if (!confirmado) return;

    mostrarAdvertencia('Eliminando permanentemente... ⏳');
    const respuesta = await eliminarProductoDefinitivoAPI(id);

    if (respuesta.exito) {
        await cargarTabla();
        mostrarExito(respuesta.mensaje || 'Producto eliminado correctamente.');
    } else {
        mostrarError('Error: ' + respuesta.mensaje);
    }
}

// Validaciones / quitar proxima actualizacion

function setInputValue(elemId, valor) {
    const elem = getElem(elemId);
    if (elem) elem.value = (valor !== null && valor !== undefined) ? valor : '';
}

function setSelectValue(elemId, valor) {
    const elem = getElem(elemId);
    if (elem) elem.value = valor || '';
}

function limpiarDatasetImagen(elem) {
    if (!elem) return;
    elem.dataset.urlActual = '';
    elem.dataset.deleteHashActual = '';
    elem.dataset.deleteUrlActual = '';
    elem.dataset.eliminarFoto = 'false';
}

function validarDatosProducto(datos) {
    if (!datos.codigoBarras) {
        mostrarAdvertencia('El código de barras es obligatorio 🏷️');
        return false;
    }
    if (datos.codigoBarras.length < 3) {
        mostrarAdvertencia('El código de barras debe tener al menos 3 caracteres');
        return false;
    }
    if (!datos.nombreProducto || datos.nombreProducto.length < 3) {
        mostrarAdvertencia('Ingresa un nombre de producto válido (mínimo 3 letras) 📦');
        return false;
    }
    if (!datos.idCategoria) {
        mostrarAdvertencia('Selecciona una categoría para el producto 📁');
        return false;
    }
    if (!datos.idMarca) {
        mostrarAdvertencia('Selecciona una marca para el producto 🏷️');
        return false;
    }
    if (!datos.idUnidad) {
        mostrarAdvertencia('Selecciona una unidad de medida 📏');
        return false;
    }
    if (isNaN(datos.precio) || datos.precio <= 0) {
        mostrarAdvertencia('El precio debe ser mayor a $0.00 💰');
        return false;
    }
    if (isNaN(datos.stock) || datos.stock < 0) {
        mostrarAdvertencia('El stock no puede ser un número negativo 📊');
        return false;
    }
    if (isNaN(datos.stockMinimo) || datos.stockMinimo < 0) {
        mostrarAdvertencia('El stock mínimo no puede ser negativo 📉');
        return false;
    }
    return true;
}