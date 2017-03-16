var baseUrl = "http://localhost:56854/api/";


function httpQuery(url, type, data, action) {
    var xmlHttp = new XMLHttpRequest();

    /* La acción es obligatoria, porque si simplemente retornamos xmlHttp,
        puede ocurrir que los campos no estén definidos todavía */
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4) {
            action(xmlHttp);
        }
    }

    xmlHttp.open(type, url, true); // true for asynchronous

    if(type == "POST" || type == "PUT") {
        xmlHttp.setRequestHeader("Content-type", "application/json");
        xmlHttp.send(data);
    }
    else {
        xmlHttp.send();
    }
}

// Método para facilitar algunas comparaciones
function allValuesSame(array, property) {
    for(var i = 1; i < array.length; i++)
    {
        if(array[i][property] !== array[0][property])     return false;
    }
    return true;
}
