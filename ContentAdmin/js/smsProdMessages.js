/**************************** VARIABLES ******************************/

var table, product, atemp;

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

window.onload = function() {
    var selfUrl = window.location.href;
    var urlParams = parseURLParams(selfUrl);

    // Id del producto a buscar viene de la URL
    productId = urlParams["id"][0];

    httpQuery(baseUrl + "productos/getoneproducto?id=" + productId, "GET", null, function(response) {
        var status = document.getElementById("status");
        if (response.status == 200) {
            var producto = JSON.parse(response.responseText);
            atemp = producto.Atemporal;
            productName = producto.Nombre;

            var title = document.getElementById("title");
            title.innerHTML = "Producto: " + productName;

            getContent(baseUrl + "contenidos/getcontenidosdeproducto?id=" + productId);
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

/******************* BOTÓN ACTUALIZAR *********************/
var getButton = document.getElementById('update-content');
getButton.onclick = function() {
    getContent(baseUrl + "contenidos/getcontenidosdeproducto?id=" + productId);
};

// Enviar query HTTP GET para obtener datos de productos
function getContent(url) {
    var xmlHttp = new XMLHttpRequest();
    var status = document.getElementById("status");
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var content = JSON.parse(xmlHttp.responseText);

            for(i = 0; i < content.length; i++) {
                // Obtener año, mes y día de la fecha
                if('FechaEnvio' in content[i] && content[i].FechaEnvio != null && content[i].FechaEnvio != undefined)
                {
                    content[i].FechaEnvio = content[i].FechaEnvio.split('T')[0];
                    var FechaEnvio = content[i].FechaEnvio.split('-');
                    content[i].Año = FechaEnvio[0];
                    content[i].Mes = intToDate(parseInt(FechaEnvio[1]));
                    content[i].Dia = FechaEnvio[2];
                }

                content[i].Largo = content[i].Texto.length;

                // Mostrar Ids de produtos separados por comas
                content[i].IdProductos = "";
                for(j = 0; j < content[i].Producto.length; j++) {
                    if(j == 0)  content[i].IdProductos += content[i].Producto[j].Id;
                    else content[i].IdProductos += ", " + content[i].Producto[j].Id;
                }
            }
            renderTable(content);
        }
        else if (xmlHttp.readyState == 4 && xmlHttp.status == 0) {
            status.innerHTML = "&#10006; No se pudo establecer la conexión";
            status.style.color = "red";
            return;
        }
        else if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            status.innerHTML = "&#10006; HTTP " + xmlHttp.status + " (" + xmlHttp.statusText + "): " + xmlHttp.responseText;
            status.style.color = "red";
            return;
        }
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send();
}

/* La página usa el plugin de JQuery Datatables para generar las tablas
    Documentación en https://datatables.net/ */
function renderTable(tableData) {

    var col, order;

    // Si el producto es temporal, mostramos el año, mes y días por separado.
    if(atemp == false)
    {
        table = $("#content-table");
        col = [     // columnas
            {data: 'Id', title: 'Id', width: '3%'},
            {data: 'FechaEnvio', title: 'Año', width: '3%',
                render: function(data, type, row) {         // Ver 'Orthogonal data' en documentación
                    if(type == "display") {
                        return data.split('-')[0];
                    }
                    else return data;
                }},
            {data: 'Mes', title: 'Mes', width: '8%',
                render: function(data, type, row) {
                    if(type == "sort") {
                        return parseInt(StringToNumMonth(data));
                    }
                    else return data;
                }},
            {data: 'Dia', title: 'Día', width: '2%'},
            {data: 'Texto', title: 'Texto', width: '50%'},
            {data: 'Largo', title: 'Largo', width: '2%'},
            {data: 'Enviado', title: 'Enviado', width: '5%'},
            {data: 'Tag', title: 'Tag', width: '15%'},
            {data: 'IdProductos', title: 'Id Productos', width: '12%'}
        ];

        /* Agregar campo de búsqueda en el encabezado de cada columna
            Las columnas 1 y 2 tienen select en vez de input.
            Ver: https://datatables.net/examples/api/multi_filter.html  */
        $('#content-table tfoot th').each( function (index) {
            if(index != 1 && index != 2) {
                var title = $(this).text();
                $(this).html( '<input type="text"/>' );
            }
        } );

        // Ordenar la tabla por año, mes, día
        order = [[ 1, "desc" ], [ 2, "desc" ], [ 3, "desc" ]];

        // Esconer la tabla que no estamos usando
        $("#content-table-atemp").css("display", "none");
    }
    // Si no, no mostramos fecha
    else {
        table = $("#content-table-atemp");
        col = [
            {data: 'Id', title: 'Id', width: '3%'},
            {data: 'Texto', title: 'Texto', width: '63%'},
            {data: 'Largo', title: 'Largo', width: '2%'},
            {data: 'Enviado', title: 'Enviado', width: '5%'},
            {data: 'Tag', title: 'Tag', width: '15%'},
            {data: 'IdProductos', title: 'Id Productos', width: '12%'}
        ];
        $('#content-table-atemp tfoot th').each( function (index) {
            var title = $(this).text();
            $(this).html( '<input type="text"/>' );
        } );

        // Ordenar por Id
        order = [[ 0, "asc" ]];

        $("#content-table").css("display", "none");
    }

    // Inicializar tabla
    table = table.DataTable( {
        destroy: true,
        data: tableData,
        columns: col,
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
        pageLength: 15,
        order: order,

        // Agregar select a las columnas 1 y 2. Ver: https://datatables.net/examples/api/multi_filter_select.html
        initComplete: function () {
            if(atemp == false) {
                this.api().columns([1,2]).every( function () {
                    var column = this;
                    var select = $('<select><option value=""></option></select>')
                        .appendTo( $(column.footer()).empty() )
                        .on( 'change', function () {
                            var val = $.fn.dataTable.util.escapeRegex(
                                $(this).val()
                            );

                            column
                                .search( val ? '^'+val+'$' : '', true, false )
                                .draw();
                        } );

                    column.data().unique().sort().each( function ( d, j ) {
                        select.append( '<option value="'+d+'">'+d+'</option>' )
                    } );
                } );
            }
        }
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
            /* Obtener datosde la tabla y guardarlos en un arreglo. También
                mostrar el modal */
            {
                text: 'Editar seleccionados',
                action: function ( e, dt, node, conf ) {
                    // Vaciar arreglo de contenidos y resetear flags
                    putData.reset();

                    // Guardar datos seleccionados de la tabla
                    var data = table.rows( { selected: true } ).data();
                    for(i = 0; i < data.length; i++) {
                        var obj = {
                            Id: data[i].Id,
                            Texto: data[i].Texto,
                            Enviado: data[i].Enviado,
                            Tag: data[i].Tag,
                            IdProductos: data[i].IdProductos
                        };
                        if(atemp == false) {
                            obj.FechaEnvio = stringToDate(data[i].Año, data[i].Mes, data[i].Dia);
                        }
                        putData.contenidos.push(obj);
                    }

                    // Limpiar inputs
                    $("#edit-form").find("input").each( function () {
                        this.value = "";
                    });
                    $("#edit-form").find("textarea").each( function () {
                        this.value = "";
                    });

                    // Fuentes de texto normales
                    $("#edit-form").find("label, input, textarea").css("font-weight", "normal");

                    /* Distinto título de modal al seleccionar uno o varios contenidos
                        Llenar placeholders de los inputs
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


/*************** DETECTAR CAMBIOS EN EL FORMULARIO ******************/
$("#input-date, #input-tag, #input-products, #input-text").on("change keyup paste", function() {
    var label = this.label;
    label.style["font-weight"] = "bold";
    this.style["font-weight"] = "bold";

    /* Cuando se escribe en alguno de los campos, se marca el campo para ser
        modificado */
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
    if(atemp && date.value != null && date.value != "") {
        status.innerHTML = "&#10006; El contenido es atemporal. No se puede agregar fecha de envío.";
        status.style.color = "red";
        return;
    }
    if(atemp == false && (date.value == null || date.value == "") ) {
        status.innerHTML = "&#10006; El contenido es temporal. No se puede borrar la fecha de envío.";
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





/*************************** FUNCIONES VARIAS *************************/

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) parms[n] = [];
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}

function stringToDate(year, month, day) {
    return year + "-" + StringToNumMonth(month) + "-" + day;
}

function intToDate(num) {
    switch (num)
    {
        case 1:
            return "Enero";
        case 2:
            return "Febrero";
        case 3:
            return "Marzo";
        case 4:
            return "Abril";
        case 5:
            return "Mayo";
        case 6:
            return "Junio";
        case 7:
            return "Julio";
        case 8:
            return "Agosto";
        case 9:
            return "Septiembre";
        case 10:
            return "Octubre";
        case 11:
            return "Noviembre";
        case 12:
            return "Diciembre";
        default:
            return num.toString();
    }
}

function StringToNumMonth(month) {
    switch (month)
    {
        case "Enero":
            return "01";
        case "Febrero":
            return "02";
        case "Marzo":
            return "03";
        case "Abril":
            return "04";
        case "Mayo":
            return "05";
        case "Junio":
            return "06";
        case "Julio":
            return "07";
        case "Agosto":
            return "08";
        case "Septiembre":
            return "09";
        case "Octubre":
            return "10";
        case "Noviembre":
            return "11";
        case "Diciembre":
            return "12";
        default:
            return "0";
    }
}
