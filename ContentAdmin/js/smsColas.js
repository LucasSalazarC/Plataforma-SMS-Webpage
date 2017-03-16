/**************************** VARIABLES ******************************/

// Array para guardar las Ids de los contenidos a borrar
var idArray = [];

// Array para guardar los datos de los contenidos a editar
var jsonArray = [];

// Método para facilitar algunas comparaciones
jsonArray.allValuesSame = function(property) {
    for(var i = 1; i < this.length; i++)
    {
        if(this[i][property] !== this[0][property])     return false;
    }
    return true;
}





/****************************** FUNCIONES ****************************/

$(document).ready(function() {
    getColas(baseUrl + 'colas/getcolas');
    getColaProductos(baseUrl + 'colaproductos/getcolaproductos');
});

// Incluir el menú lateral, y agregar la clase 'active' donde corresponde
(function() {
    $("#sidebar-menu").load("sidebarMenu.html", function() {
        $("#sms-collapse").addClass("in");
        $("#entry3").addClass("active").removeAttr("href");
    });
}());





/************************************************************
 ************************ COLAS *****************************
 ***********************************************************/

/******************* BOTÓN ACTUALIZAR *********************/
var getButton = document.getElementById('update-colas');
getButton.onclick = function() {
    getColas(baseUrl + 'colas/getcolas');
};

// Enviar query HTTP GET para obtener datos de productos
function getColas(url) {
    var status = document.getElementById("colas-status");
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var colas = JSON.parse(xmlHttp.responseText);
            renderTable(colas);
        }
        else if (xmlHttp.readyState == 4 && xmlHttp.status == 0) {
            status.innerHTML = "No se pudo establecer la conexión";
            status.style.color = "red";
        }
        else if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            status.innerHTML = "&#10006; HTTP " + xmlHttp.status + " (" + xmlHttp.statusText + "): " + xmlHttp.responseText;
            status.style.color = "red";
        }
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send();
}


/* La página usa el plugin de JQuery Datatables para generar las tablas
    Documentación en https://datatables.net/ */
function renderTable(tableData) {

    /* Agregar campo de búsqueda en el encabezado de cada columna
        Las columnas 1 y 2 tienen select en vez de input.
        Ver: https://datatables.net/examples/api/multi_filter.html  */
    $('#content-table tfoot th').each( function (index) {
        var title = $(this).text();
        $(this).html( '<input type="text"/>' );
    } );


    var table = $('#content-table').DataTable( {
        destroy: true,
        data: tableData,
        columns: [
            {data: 'Id', title: 'Id', width: '5%'},
            {data: 'Texto', title: 'Texto', width: '90%'},
            {data: 'Largo', title: 'Largo', width: '5%'}
        ],
        select: true,
        language: {
            select: {
                rows: {
                    _: "%d resultados seleccionados",
                    0: "Click en un resultado para seleccionarlo",
                    1: "1 resultado seleccionado"
                }
            },
            search: "Filtrar resultados:",
            info: "_TOTAL_ resultados en total.",
            lengthMenu: "Mostrar _MENU_ resultados",
            paginate: {
                next: "Siguiente",
                previous: "Anterior"
            }
        },
        lengthMenu: [ [10, 15, 25, 50, -1], [10, 15, 25, 50, "Todos"] ],
        pageLength: 10
    } );

    new $.fn.dataTable.Buttons( table, {
        buttons: [
            /*************** BOTÓN BORRAR ***************/
            {
                text: 'Borrar seleccionados',
                action: function ( e, dt, node, conf ) {

                    idArray.length = 0;

                    // Obtener Ids de contenidos seleccionados
                    var data = table.rows({selected: true}).data();
                    for(i = 0; i < data.length; i++) {
                        idArray.push(data[i].Id);
                    }

                    // Mostrar modal de confirmación
                    var modalText = document.getElementById("delete-modal-text");
                    var status = document.getElementById("colas-status");
                    if(idArray.length > 0) {
                        if(idArray.length == 1) {
                            modalText.innerHTML = "<p>Se borrará 1 cola. Seguro?</p>";
                        }
                        else {
                            modalText.innerHTML = "<p>Se borrarán " + idArray.length.toString() + " colas. Seguro?</p>";
                        }
                        status.innerHTML = "";
                        $("#delete-confirm").modal();
                    }
                }
            },

            /*********************** BOTÓN EDITAR ************************/
            /* Obtener datosde la tabla y guardarlos en un arreglo. También
                mostrar el modal */
            {
                text: 'Editar seleccionados',
                action: function ( e, dt, node, conf ) {

                    jsonArray.length = 0;

                    // Store selected data from the table
                    var data = table.rows( { selected: true } ).data();
                    for(i = 0; i < data.length; i++) {
                        var obj = {
                            Id: data[i].Id,
                            Texto: data[i].Texto
                        };
                        jsonArray.push(obj);
                    }

                    // Limpiar inputs
                    $("#edit-form").find("input").each( function () {
                        this.value = "";
                    });

                    /* Distinto título de modal al seleccionar uno o varios contenidos
                        Llenar placeholders de los inputs
                        Si no hay mensajes seleccionados no se muestra el modal */
                    var title = document.getElementById("content-modal-title");
                    if(data.length > 0) {

                        var text = document.getElementById('input-text');

                        if(data.length == 1) {
                            title.innerHTML = "Editando 1 cola";
                            text.value = jsonArray[0].Texto;
                        }
                        else if(data.length > 1) {
                            title.innerHTML = "Editar varias colas";

                            if(jsonArray.allValuesSame('Texto')) {
                                text.value = jsonArray[0].Texto;
                            }
                            else text.setAttribute('placeholder', 'Varios valores...');
                        }

                        // Bring up modal
                        document.getElementById("edit-status").innerHTML = "";
                        document.getElementById("colas-status").innerHTML = "";
                        $("#content-edit-modal").modal();
                    }
                }
            }
        ]
    } );

    // Poner los botones abajo de la tabla
    table.buttons( 0, null ).container().insertAfter(
        table.table().container()
    );

    // Configuración de inputs. Ver: https://datatables.net/examples/api/multi_filter.html
    table.columns().every( function () {
        var that = this;

        $( 'input', this.footer() ).on( 'keyup change', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value )
                    .draw();
            }
        } );
    } );
}



/****************** BOTÓN DE CONFIRMACIÓN BORRAR *********************/
var deleteButton = document.getElementById('delete-button');
deleteButton.onclick = function() {
    var status = document.getElementById("colas-status");
    status.innerHTML = "Enviando petición para borrar...";
    status.style.color = "black";

    httpQuery(baseUrl + 'colas/deletecolas', "POST", JSON.stringify(idArray), function(response) {
        if (response.status == 200) {
            status.innerHTML = "&#10004; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            status.style.color = "green";
        }
        else if (response.status == 0) {
            status.innerHTML = "No se pudo establecer la conexión";
            status.style.color = "red";
        }
        else {
            status.innerHTML = "&#10006; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            status.style.color = "red";
        }
    });
}



/****************** PUT BUTTON (Enviar) ***********************/
var putButton = document.getElementById('put-button');
putButton.onclick = function() {
    var globalStatus = document.getElementById("colas-status");
    var status = document.getElementById("edit-status");
    status.innerHTML = "Procesando y enviando datos...";
    status.style.color = "black";

    // Obtener texto escrito por el usuario y guardarlo en un arreglo, si no es nulo
    var text = document.getElementById('input-text').value;
    if(text == null || text == "") {
        status.innerHTML = "&#10006; El campo 'Texto' es obligatorio.";
        status.style.color = "red";
        return;
    }

    for(i = 0; i < jsonArray.length; i++) {
        jsonArray[i].Texto = text;
    }

    // Eviar el arreglo de objetos JSON al servicio para que acualice la base de datos
    httpQuery(baseUrl + 'colas/putcolas', "PUT", JSON.stringify(jsonArray), function(response) {
        if (response.status == 200) {
            globalStatus.innerHTML = "&#10004; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            globalStatus.style.color = "green";
            $("#content-edit-modal").modal("hide");
        }
        else if (response.status == 0) {
            status.innerHTML = "No se pudo establecer la conexión";
            status.style.color = "red";
        }
        else {
            status.innerHTML = "&#10006; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            status.style.color = "red";
        }
    });
};




/************* SUBIR UNA COLA *********/
var postButton = document.getElementById('upload-cola');
postButton.onclick = function() {
    var status = document.getElementById("upload-status");

    // Obtener datos del formulario
    var text = document.getElementById('upload-input-text').value;
    cola = {};

    // No se premiten textos vacíos
    if(text == null || text == "") {
        status.innerHTML = "&#10006; El campo 'Texto' es obligatorio";
        status.style.color = "red";
        return;
    }
    cola["Texto"] = text;

    status.innerHTML = "Subiendo mensaje...";
    status.style.color = "black";

    // Enviar los datos al servicio para que los agregue a la base de datos
    httpQuery(baseUrl + 'colas/postcola', "POST", JSON.stringify(cola), function(response) {
        if (response.status == 200) {
            status.innerHTML = "&#10004; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            status.style.color = "green";
        }
        else if (response.status == 0) {
            status.innerHTML = "No se pudo establecer la conexión";
            status.style.color = "red";
        }
        else {
            status.innerHTML = "&#10006; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            status.style.color = "red";
        }
    });
};








/************************************************************
 **************** ASOCIACIONES COLA/PRODUCTO ****************
 ***********************************************************/

/******************* BOTÓN ACTUALIZAR *********************/
var getButton = document.getElementById('update-colaproducto');
getButton.onclick = function() {
    getColaProductos(baseUrl + 'colaproductos/getcolaproductos');
};

// Enviar query HTTP GET para obtener datos de productos
function getColaProductos(url) {
    var status = document.getElementById("colaproducto-status");
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var colaProductos = JSON.parse(xmlHttp.responseText);

            // Arreglar Fechas
            for(i = 0; i < colaProductos.length; i++) {
                colaProductos[i].FechaInicio = colaProductos[i].FechaInicio.split('T')[0];
                colaProductos[i].FechaTermino = colaProductos[i].FechaTermino.split('T')[0];
            }

            renderSecondTable(colaProductos);
        }
        else if (xmlHttp.readyState == 4 && xmlHttp.status == 0) {
            status.innerHTML = "No se pudo establecer la conexión";
            status.style.color = "red";
        }
        else if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            status.innerHTML = "&#10006; HTTP " + xmlHttp.status + " (" + xmlHttp.statusText + "): " + xmlHttp.responseText;
            status.style.color = "red";
        }
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send();
}


// La página usa el plugin de JQuery Datatables para generar las tablas
function renderSecondTable(tableData) {

    /* Agregar campo de búsqueda en el encabezado de cada columna
        Las columnas 1 y 2 tienen select en vez de input.
        Ver: https://datatables.net/examples/api/multi_filter.html  */
    $('#cp-content-table tfoot th').each( function (index) {
        var title = $(this).text();
        $(this).html( '<input type="text"/>' );
    } );

    var table = $('#cp-content-table').DataTable( {
        destroy: true,
        data: tableData,
        columns: [
            {data: 'Id', title: 'Id Asociacion', width: '20%'},
            {data: 'IdProducto', title: 'Id Producto', width: '20%'},
            {data: 'IdCola', title: 'Id Cola', width: '20%'},
            {data: 'FechaInicio', title: 'Fecha Inicio', width: '20%'},
            {data: 'FechaTermino', title: 'Fecha Termino', width: '20%'}
        ],
        select: true,
        language: {
            select: {
                rows: {
                    _: "%d resultados seleccionados",
                    0: "Click en un resultado para seleccionarlo",
                    1: "1 resultado seleccionado"
                }
            },
            search: "Filtrar resultados:",
            info: "_TOTAL_ resultados en total.",
            lengthMenu: "Mostrar _MENU_ resultado",
            paginate: {
                next: "Siguiente",
                previous: "Anterior"
            }
        },
        lengthMenu: [ [10, 15, 25, 50, -1], [10, 15, 25, 50, "Todos"] ],
        pageLength: 10
    } );

    new $.fn.dataTable.Buttons( table, {
        buttons: [
            /*************** DELETE BUTTON ***************/
            {
                text: 'Borrar seleccionados',
                action: function ( e, dt, node, conf ) {

                    idArray.length = 0;

                    // Obtener Ids de filas seleccionadas
                    var data = table.rows({selected: true}).data();
                    for(i = 0; i < data.length; i++) {
                        idArray.push(data[i].Id);
                    }

                    // Mostrar Modal
                    var modalText = document.getElementById("cp-delete-modal-text");
                    if(idArray.length > 0) {
                        if(idArray.length == 1) {
                            modalText.innerHTML = "<p>Se borrará 1 asociación. Seguro?</p>";
                        }
                        else {
                            modalText.innerHTML = "<p>Se borrarán " + idArray.length.toString() + " asociaciones. Seguro?</p>";
                        }
                        document.getElementById("colaproducto-status").innerHTML = "";
                        $("#cp-delete-confirm").modal();
                    }
                }
            }
        ]
    } );

    // Poner los botones abajo de la tabla
    table.buttons( 0, null ).container().insertAfter(
        table.table().container()
    );

    // Configuración de inputs. Ver: https://datatables.net/examples/api/multi_filter.html
    table.columns().every( function () {
        var that = this;

        $( 'input', this.footer() ).on( 'keyup change', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value )
                    .draw();
            }
        } );
    } );
}

/****************** BOTÓN DE CONFIRMACIÓN BORRAR *********************/
var deleteButton = document.getElementById('cp-delete-button');
deleteButton.onclick = function() {
    var status = document.getElementById("colaproducto-status");
    status.innerHTML = "Enviando petición para borrar...";
    status.style.color = "black";
    httpQuery(baseUrl + 'colaproductos/deletecolaproductos', "POST", JSON.stringify(idArray),function(response) {
        if (response.status == 200) {
            status.innerHTML = "&#10004; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            status.style.color = "green";
        }
        else if (response.status == 0) {
            status.innerHTML = "No se pudo establecer la conexión";
            status.style.color = "red";
        }
        else {
            status.innerHTML = "&#10006; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            status.style.color = "red";
        }
    });
}



/************* CREAR UNA ASOCIACION *********/
var cpPostButton = document.getElementById('cp-upload');
cpPostButton.onclick = function() {
    // Obtener datos del formulario
    var idProd = document.getElementById('cp-input-idProd').value;
    var idCola = document.getElementById('cp-input-idCola').value;
    var fechaInicio = document.getElementById('cp-input-fechaInicio').value;
    var fechaTermino = document.getElementById('cp-input-fechaTermino').value;

    var uploadStatus = document.getElementById("cp-upload-status");

    if(idProd == null || idProd == "") {
        uploadStatus.innerHTML = "&#10006; El campo 'Id Producto' no puede estar vacío";
        uploadStatus.style.color = "red";
        return;
    }
    if(idCola == null || idCola == "") {
        uploadStatus.innerHTML = "&#10006; El campo 'Id Cola' no puede estar vacío";
        uploadStatus.style.color = "red";
        return;
    }
    if(fechaInicio == null || fechaInicio == "") {
        uploadStatus.innerHTML = "&#10006; El campo 'Fecha Inicio' no puede estar vacío";
        uploadStatus.style.color = "red";
        return;
    }
    if(fechaTermino == null || fechaTermino == "") {
        uploadStatus.innerHTML = "&#10006; El campo 'Fecha Término' no puede estar vacío";
        uploadStatus.style.color = "red";
        return;
    }

    uploadStatus.innerHTML = "Subiendo mensaje...";
    uploadStatus.style.color = "black";

    var colaProducto = {
         IdProducto: idProd,
         IdCola: idCola,
         FechaInicio: fechaInicio,
         FechaTermino: fechaTermino
     };

    // Enviar los datos al servicio para que los agregue a la base de datos
    httpQuery(baseUrl + 'colaproductos/postcolaproducto', "POST", JSON.stringify(colaProducto), function(response) {
        if (response.status == 200) {
            uploadStatus.innerHTML = "&#10004; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            uploadStatus.style.color = "green";
        }
        else if(response.status == 0) {
            uploadStatus.innerHTML = "&#10006; No se pudo establecer la conexión";
            uploadStatus.style.color = "red";
        }
        else {
            uploadStatus.innerHTML = "&#10006; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            uploadStatus.style.color = "red";
        }
    });
};
