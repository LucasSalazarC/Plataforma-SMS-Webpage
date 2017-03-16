
// Incluir el menú lateral, y agregar la clase 'active' donde corresponde
(function() {
    $("#sidebar-menu").load("sidebarMenu.html", function() {
        $("#sms-collapse").addClass("in");
        $("#entry1").addClass("active").removeAttr("href");
    });
}());


/********** SUBIR EXCEL ************/
var uploadButton = document.getElementById('upload-excel');
uploadButton.onclick = function() {
    var selectedFile = document.getElementById('my-file-selector').files[0];
    var reader = new FileReader();

    var excelStatus = document.getElementById("excel-status");
    excelStatus.innerHTML = "Procesando y subiendo archivo...";
    excelStatus.style.color = "black";

    // Leer archivo excel, usando library js-xlsx. Ver: https://github.com/SheetJS/js-xlsx
    reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {type: 'binary'});

        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];

        // Obtener primera celda no vacía
        var keys = Object.keys(worksheet);  //Direcciones de todas las celdas ocupadas, más algunos datos extra

        // Las propiedades del objeto que comienzan con '!'no corresponden a celdas, sino que a información sobre la hoja entera
        var startIndex;
        for(startIndex = 0; keys[startIndex][0] == '!'; startIndex++) {}
        var first = keys[startIndex][0].charCodeAt();

        var cols = 4;

        // Leer desde la segunda fila; la primera contiene los títulos
        var rowIndex = parseInt(keys[startIndex].substring(1)) + 1;
        var jsonArray = [];

        /* Leer celda por celda, y guardar el resultado en un arreglo JSON.
            El loop termina cuando se encuentra una celda vacía en la primera
            columna.  */
        do {
            var jsonObj = {};
            for(i = first; i < cols + first; i++) {
                var address = String.fromCharCode(i) + rowIndex.toString();
                if(address in worksheet){
                    switch(i) {
                        case first:
                            jsonObj['Texto'] = worksheet[address].w;
                            break;
                        case first + 1:
                            jsonObj['FechaEnvio'] = worksheet[address].w;
                            break;
                        case first + 2:
                            jsonObj['Tag'] = worksheet[address].w;
                            break;
                        case first + 3:
                            var ids = worksheet[address].w.replace(/\s/g, '');
                            if(ids.includes(',')) {
                                jsonObj['IdProductos'] = ids.split(',');
                            }
                            else if(ids.includes('.')) {
                                jsonObj['IdProductos'] = ids.split('.');
                            }
                            else jsonObj['IdProductos'] = [ids];
                            break;
                    }
                }
            }
            rowIndex++;
            jsonArray.push(jsonObj);
        } while(String.fromCharCode(first) + rowIndex.toString() in worksheet);


        // Enviar el arreglo de objetos JSON para agregarlos a la base de datos
        httpQuery(baseUrl + 'contenidos/postmanycontenidos', "POST", JSON.stringify(jsonArray), function(response) {
            var status = document.getElementById("excel-status");
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
    reader.readAsBinaryString(selectedFile);
}











// Llenar las opciones de productos: Enviar HTTP GET para obtener nombres e Ids
$(document).ready(function() {
    var url = baseUrl + "productos/getprodidname";
    httpQuery(baseUrl + "productos/getprodidname", "GET", null, function(response) {
        var status = document.getElementById("message-status");
        if (response.status == 200) {
            var products = JSON.parse(response.responseText);

            for(i = 0; i < products.length; i++) {
                $("#input-product").append("<option value='" + products[i].Id + "'>" + products[i].Nombre + "</option>");
            }
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
});

/************* SUBIR UN SÓLO UN SMS *********/
var postButton = document.getElementById('post-message');
postButton.onclick = function() {
    var status = document.getElementById("message-status");

    // Obtener datos de los campos y luego guardarlos en un objeto
    var date = document.getElementById('input-date').value;
    var tag = document.getElementById('input-tag').value;
    var text = document.getElementById('input-text').value;
    var prodId = document.getElementById('input-products').value.replace(/\s/g, '').split(',');

    if(text == "") {
        status.innerHTML = "&#10006; El campo 'Texto' es obligatorio";
        status.style.color = "red";
        return;
    }
    if(prodId == "") {
        status.innerHTML = "&#10006; El campo 'Id Productos' es obligatorio";
        status.style.color = "red";
        return;
    }

    var content = {
        Texto: text,
        FechaEnvio: date,
        IdProductos: prodId
    };

    if(tag != "")    content["Tag"] = tag;

    status.innerHTML = "Subiendo mensaje...";
    status.style.color = "black";

    // We send the JSON object to be added to the database
    httpQuery(baseUrl + 'contenidos/postcontenido', "POST", JSON.stringify(content), function(response) {
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
