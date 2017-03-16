// URL del servicio web
var url = baseUrl + 'productos/getproductos';

// Incluir el menú lateral, y agregar la clase 'active' donde corresponde
(function() {
    $("#sidebar-menu").load("sidebarMenu.html", function() {
        $("#entry0").removeAttr("href");
    });
}());


$(document).ready(function() {
    getProducts(url);
});

/******************* BOTÓN ACTUALIZAR *********************/
var getButton = document.getElementById('update-products');
getButton.onclick = function() {
    getProducts(url);
};

// Enviar query HTTP GET para obtener datos de productos
function getProducts(url) {
    var xmlHttp = new XMLHttpRequest();
    var status = document.getElementById("status");
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var products = JSON.parse(xmlHttp.responseText);
            renderTable(products);
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

// La página usa el plugin de JQuery DataTables para generar las tablas
function renderTable(tableData) {

    // Añadir entrada de texto a cada columna, para poder buscar
    $('#product-table tfoot th').each( function (index) {
        if(index != 1) {
            var title = $(this).text();
            $(this).html( '<input type="text"/>' );
        }
    } );

    // Inicializar tabla, con muchas opciones...
    var table = $('#product-table').DataTable( {
        destroy: true,
        data: tableData,
        columns: [
            {data: 'Id', title: 'Id', width: '3%'},
            {data: 'Categoria.Nombre', title: 'Categoría', width: '36%'},
            {data: 'Nombre', title: 'Nombre', width: '41%',
                fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<a href='http://localhost/ContentAdmin/smsProdMessages?id="
                                + oData.Id + "'>" + oData.Nombre + "</a>");
                }
            },
            {data: 'Atemporal', title: 'Atemporal', width: '5%'},
            {data: 'DiasRestantes', title: 'Días Restantes', width: '15%'}
        ],
        select: false,
        language: {
            search:         "Filtrar resultados:",
            info:           "Resultados encontrados: _TOTAL_.",
            infoEmpty:      "Mostrando 0 resultados",
            infoFiltered:   "(Resultados totales: _MAX_)",
            lengthMenu:     "Mostrar _MENU_ resultados",
            zeroRecords:    "No se encontraron resultados",
            paginate: {
                next: "Siguiente",
                previous: "Anterior"
            }
        },
        lengthMenu: [ [10, 15, 25, 50, -1], [10, 15, 25, 50, "Todos"] ],
        pageLength: 15,
        order: [[ 4, "asc" ]],

        initComplete: function () {
            var column = this.api().column(1);
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
        },

        // Colores para indicar productos a los cuales les quedan pocos días
        createdRow: function( row, data, dataIndex ) {
            if ( data["DiasRestantes"] <= 2 ) {
                $('td', row).eq(4).css("background-color", "red");
                $('td', row).eq(4).css("color", "white");
                $('td', row).eq(4).css("font-weight", "bold");
            }
            else if ( data["DiasRestantes"] <= 5 ) {
                $('td', row).eq(4).css("background-color", "orange");
                $('td', row).eq(4).css("color", "white");
                $('td', row).eq(4).css("font-weight", "bold");
            }
            else if ( data["DiasRestantes"] <= 8 ) {
                $('td', row).eq(4).css("background-color", "yellow");
                $('td', row).eq(4).css("font-weight", "bold");
            }
         }
    } );

    // Habilitar búsqueda inividual de columnas
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
