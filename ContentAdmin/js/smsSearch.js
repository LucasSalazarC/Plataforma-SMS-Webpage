/**************************** VARIABLES ******************************/

var table;

// Array para guardar las Ids de los contenidos a borrar
var idArray = [];

// Array para guardar los datos de los contenidos a editar
var putData = {
    reset: function() {
        /* Las flags indican cuáles contenidos han sido modificados */
        this["contenidos"] = [];
        this["FlagTexto"] = false;
        this["FlagFecha"] = false;
        this["FlagTag"] = false;
        this["FlagProductos"] = false;
    }
};






// Incluir el menú lateral, y agregar la clase 'active' donde corresponde
(function() {
    $("#sidebar-menu").load("sidebarMenu.html", function() {
        $("#sms-collapse").addClass("in");
        $("#entry2").addClass("active").removeAttr("href");
    });
}());

// Asociar labels con sus inputs
$(document).ready(function() {
    var labels = document.getElementsByTagName("label");
    for (var i = 0; i < labels.length; i++) {
        if (labels[i].htmlFor != '') {
             var elem = document.getElementById(labels[i].htmlFor);
             if (elem)
                elem.label = labels[i];
        }
    }
});


/************ GET BUTTON *************/
/* Enviar HTTP GET al servicio, que luego se conecta a la base de datos y
    busca los mensajes. Al recibir la respuesta, se genera la tabla
    Los parámetros de búsqueda van en la URL */
var getButton = document.getElementById('get-content');
getButton.onclick = function() {
    var status = document.getElementById("status");
    status.innerHTML = "";

    // Obtener datos de los inputs, y generar la URL
    var id = document.getElementById('search-input-id').value.replace(/\s/g, '');
    var product = document.getElementById('search-input-product').value;
    var year = document.getElementById('search-input-year').value.replace(/\s/g, '');
    var month = document.getElementById('search-input-month').value.replace(/\s/g, '');
    var day = document.getElementById('search-input-day').value.replace(/\s/g, '');
    var text = document.getElementById('search-input-text').value;
    var tag = document.getElementById('search-input-tag').value.replace(/\s/g, '');

    var url = baseUrl + 'contenidos/searchcontenidos?';

    if(id != null && id != "") {
        url += 'Id=' + id + '&';
    }

    if(product != null && product != "") {
        var firstChar = product.charAt(0);
        if(firstChar >= '1' && firstChar <= '9') {
            url += 'IdProductos=' + product.replace(/\s/g, '') + '&';
        }
        else {
            url += 'NombreProducto=' + product + '&';
        }
    }

    var y = year != null && year != "";
    var m = month != null && month != "";
    var d = day != null && day != "";
    if( y || m || d ) {
        url += 'FechaFormateada=' + year + '-' + month + '-' + day + '&';
    }

    if(text != null && text != "")  url += 'Texto=' + text + '&';
    if(tag != null && tag != "")    url += 'Tag=' + tag + '&';

    if(url.slice(-1) == '&')  url = url.slice(0, -1);

    httpQuery(url, "GET", null, function(response) {
        if (response.status == 200) {
            var content = JSON.parse(response.responseText);

            for(i = 0; i < content.length; i++) {
                // Obtener sólo fecha, y no hora
                if('FechaEnvio' in content[i] && content[i].FechaEnvio != null && content[i].FechaEnvio != undefined)
                {
                    content[i].FechaEnvio = content[i].FechaEnvio.split('T')[0];
                }

                content[i].Largo = content[i].Texto.length;

                // Id de productos separadas por comas
                content[i].IdProductos = "";
                for(j = 0; j < content[i].Producto.length; j++) {
                    if(j == 0)  content[i].IdProductos += content[i].Producto[j].Id;
                    else content[i].IdProductos += ", " + content[i].Producto[j].Id;
                }
            }
            renderTable(content);
        }
        else if (response.status == 0) {
            status.innerHTML = "&#10006; No se pudo establecer la conexión";
            status.style.color = "red";
            return;
        }
        else if (response.status != 200) {
            status.innerHTML = "&#10006; HTTP " + response.status + " (" + response.statusText + "): " + response.responseText;
            status.style.color = "red";
            return;
        }
    });
};

/* La página usa el plugin de JQuery Datatables para generar las tablas
    Documentación en https://datatables.net/ */
function renderTable(tableData) {

    /* Agregar campo de búsqueda en el encabezado de cada columna.
        Ver: https://datatables.net/examples/api/multi_filter.html  */
    $('#content-table tfoot th').each( function (index) {
        var title = $(this).text();
        $(this).html( '<input type="text"/>' );
    } );


    table = $('#content-table').DataTable( {
        destroy: true,
        data: tableData,
        columns: [
            {data: 'Id', title: 'Id', width: '3%'},
            {data: 'FechaEnvio', title: 'Fecha', width: '8%'},
            {data: 'Texto', title: 'Texto', width: '50%'},
            {data: 'Largo', title: 'Largo', width: '2%'},
            {data: 'Enviado', title: 'Enviado', width: '5%'},
            {data: 'Tag', title: 'Tag', width: '20%'},
            {data: 'IdProductos', title: 'Id Productos', width: '12%'}
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
        pageLength: 15
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
                    var status = document.getElementById("status");
                    if(idArray.length > 0) {
                        if(idArray.length == 1) {
                            modalText.innerHTML = "<p>Se borrará 1 mensaje. Seguro?</p>";
                        }
                        else {
                            modalText.innerHTML = "<p>Se borrarán " + idArray.length.toString() + " mensajes. Seguro?</p>";
                        }
                        status.innerHTML = "";
                        $("#delete-confirm").modal();
                    }
                }
            },

            /*********************** BOTÓN EDITAR ************************/
            /* Obtener datos de la tabla y guardarlos en un arreglo. También
                mostrar el modal */
            {
                text: 'Editar seleccionados',
                action: function ( e, dt, node, conf ) {
                    // Vaciar arreglo de contenidos y resetear flags
                    putData.reset();

                    // Guardar los datos seleccionados de la tabla
                    var data = table.rows( { selected: true } ).data();
                    for(i = 0; i < data.length; i++) {
                        var obj = {
                            Id: data[i].Id,
                            Texto: data[i].Texto,
                            FechaEnvio: data[i].FechaEnvio,
                            Enviado: data[i].Enviado,
                            Tag: data[i].Tag,
                            IdProductos: data[i].IdProductos
                        };
                        putData.contenidos.push(obj);
                    }

                    // Despejar campos de entrada
                    $("#edit-form").find("input").each( function () {
                        this.value = "";
                    });
                    $("#edit-form").find("textarea").each( function () {
                        this.value = "";
                    });

                    // Fuentes de texto normales
                    $("#edit-form").find("label, input, textarea").css("font-weight", "normal");

                    /* Distinto título de modal al seleccionar uno o varios contenidos
                        LLenar los placeholders de los inputs
                        Si no hay mensajes seleccionados no se muestra el modal */
                    var title = document.getElementById("content-modal-title");
                    if(data.length > 0) {

                        var date = document.getElementById('input-date');
                        var tag = document.getElementById('input-tag');
                        var text = document.getElementById('input-text');
                        var products = document.getElementById("input-products");

                        if(data.length == 1) {
                            title.innerHTML = "Editando 1 contenido";

                            if(putData.contenidos[0].FechaEnvio != null && putData.contenidos[0].FechaEnvio != ""){
                                date.value = putData.contenidos[0].FechaEnvio;
                            }
                            else    date.setAttribute('placeholder', 'Vacío');

                            text.value = putData.contenidos[0].Texto;
                            products.value = putData.contenidos[0].IdProductos;

                            if(putData.contenidos[0].Tag != null && putData.contenidos[0].Tag != "") {
                                tag.value = putData.contenidos[0].Tag;
                            }
                            else    tag.setAttribute('placeholder', 'Vacío');

                        }
                        else if(data.length > 1) {
                            title.innerHTML = "Editar varios mensajes";

                            if(allValuesSame(putData.contenidos, 'FechaEnvio')) {
                                if(putData.contenidos[0].FechaEnvio != null && putData.contenidos[0].FechaEnvio != ""){
                                    date.value = putData.contenidos[0].FechaEnvio;
                                }
                                else    date.setAttribute('placeholder', 'Vacío');
                            }
                            else date.setAttribute('placeholder', 'Varios valores...');

                            if(allValuesSame(putData.contenidos, 'Tag')) {
                                if(putData.contenidos[0].Tag != null && putData.contenidos[0].Tag != "") {
                                    tag.value = putData.contenidos[0].Tag;
                                }
                                else    tag.setAttribute('placeholder', 'Vacío');
                            }
                            else tag.setAttribute('placeholder', 'Varios valores...');

                            if(allValuesSame(putData.contenidos, 'Texto')) {
                                text.value = putData.contenidos[0].Texto;
                            }
                            else text.setAttribute('placeholder', 'Varios valores...');

                            if(allValuesSame(putData.contenidos, 'IdProductos')) {
                                products.value = putData.contenidos[0].IdProductos;
                            }
                            else products.setAttribute('placeholder', 'Varios valores...');
                        }

                        // Mostrar modal
                        document.getElementById("edit-status").innerHTML = "";
                        document.getElementById("status").innerHTML = "";
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


/*********************** CLEAR BUTTON (Despejar) ********************/
var getButton = document.getElementById('clear-search-form');
getButton.onclick = function() {
    var form = document.getElementById("search-form");
    form.reset();
};



/*************** DETECTAR CAMBIOS EN EL FORMULARIO ******************/
$("#input-date, #input-tag, #input-products, #input-text").on("change keyup paste", function() {
    var label = this.label;
    label.style["font-weight"] = "bold";
    this.style["font-weight"] = "bold";

    // Cuando se escribe en alguno de los campos, se marca el campo para ser
    // modificado
    if(this.id == "input-date")  putData["FlagFecha"] = true;
    if(this.id == "input-tag")  putData["FlagTag"] = true;
    if(this.id == "input-products")  putData["FlagProductos"] = true;
    if(this.id == "input-text")  putData["FlagTexto"] = true;
});

/****************** PUT BUTTON (Enviar) ***********************/
var putButton = document.getElementById('put-button');
putButton.onclick = function() {
    var status = document.getElementById("edit-status");
    var globalStatus = document.getElementById("status");

    status.innerHTML = "Procesando y enviando datos...";
    status.style.color = "black";

    /* Obtener valores de los inputs, y si son válidos, guardarlos en el arreglo
        para enviarlos */
    var date = document.getElementById('input-date');
    var tag = document.getElementById('input-tag');
    var text = document.getElementById('input-text');
    var products = document.getElementById('input-products');

    if(text.value == "" && putData["FlagTexto"] == true) {
        status.innerHTML = "&#10006; El campo 'Texto' es obligatorio.";
        status.style.color = "red";
        return;
    }
    if(products.value == "" && putData["FlagProductos"] == true) {
        status.innerHTML = "&#10006; El campo 'Id Productos' es obligatorio.";
        status.style.color = "red";
        return;
    }

    for(i = 0; i < putData.contenidos.length; i++) {
        putData.contenidos[i].FechaEnvio = date.value;
        putData.contenidos[i].Texto = text.value;
        putData.contenidos[i].IdProductos = products.value.replace(/\s/g, '').split(',');

        // No se permiten strings vacíos. Debe ser nulo.
        if(tag.value == "")  delete putData.contenidos[i].Tag;
        else  putData.contenidos[i].Tag = tag.value;
    }

    // Enviar los datos para actualizar la base de datos
    httpQuery(baseUrl + 'contenidos/putcontenidos', "PUT", JSON.stringify(putData), function(response) {
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




/****************** BOTÓN DE CONFIRMACIÓN BORRAR *********************/
var deleteButton = document.getElementById('delete-button');
deleteButton.onclick = function() {
    var status = document.getElementById("status");
    status.innerHTML = "Enviando petición para borrar...";
    status.style.color = "black";

    httpQuery(baseUrl + 'contenidos/deletecontenidos', "POST", JSON.stringify(idArray), function(response) {

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
