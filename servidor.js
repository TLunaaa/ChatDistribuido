const http = require('http');
const net = require('./servidor-net');
const url = require('url');
const heartbeat = require('heartbeats');
const List = require('collections/list')
var express = require('express');
var app = express();

const PORT = 8080;

var clientesActivos = new List();


app.get('/register', function (req, res) {
    console.log('>Conexion establecida con: '+ req.socket.remoteAddress);
    getURL(req.url,res);
    let data = JSON.parse(JSON.stringify(clientesActivos));
    res.json(data);
});

app.get('/request', function (req, res) {
    try {
        res.set(
            {
                'Date': (new Date()).toString(),
                'Content-Type': 'text/html',
            });
        res.send(formatHTML());
    }
    catch (e) {
        console.log(e);
        res.writeHead(404);
        res.send(formatHTML());
    }
});

app.listen(PORT, function () {
    console.log('Example app listening on port '+PORT+'!');
});

var heart = heartbeat.createHeart(5000);
heart.createEvent(1,(count,last)=>{
    let ts = (new Date()).getTime();
    clientesActivos.forEach((element)=>{
        if(ts - element.timestamp >= 90000){
            console.log(">El cliente "+ element.ip +" esta ahora inactivo");
            clientesActivos.delete(element);
            console.log(">Clientes activos: "+clientesActivos.length);
        }
    })
})

function getURL(pathurl,res){
    if(typeof pathurl === 'string'){
        parsedURL = url.parse(pathurl);
        if(parsedURL.pathname == '/register'){
            let username = (parsedURL.query.split('&')[0]).split('=')[1];
            let ip = (parsedURL.query.split('&')[1]).split('=')[1];
            let port = (parsedURL.query.split('&')[2]).split('=')[1];
            cliente = {
                username : username,
                ip: ip,
                port : port,
                timestamp: (new Date()).getTime(),
            }
            let esta = false;
            clientesActivos.forEach(element=>{
                if(element.ip == ip ){
                    esta = true;
                    element.timestamp = (new Date()).getTime();
                    element.username = username;
                }
            })
            if(esta == false){
                clientesActivos.push(cliente);
            }
        }
    }
}

function formatHTML() {
    var respuesta = `<!DOCTYPE html>
    <html>
    <head>
    <style>
    table {
      font-family: arial, sans-serif;
      border-collapse: collapse;
      width: 100%;
    }
    td, th {
      border: 1px solid #dddddd;
      text-align: left;
      padding: 8px;
    }
    tr:nth-child(even) {
      background-color: #dddddd;
    }
    </style>
    </head>
    <body>
    <h2>Connected Clients</h2>
    <table>
      <tr>
        <th>Username</th>
        <th>IP</th>
        <th>PORT</th>
        <th>Timestamp</th>
      </tr>`
    clientesActivos.forEach(cliente => {
        respuesta += `<tr>
            <td>` + cliente.username + `</td>
            <td>` + cliente.ip + `</td>
            <td>` + cliente.port + `</td>
            <td>` + cliente.timestamp + `</td>
        </tr>`;
    });
     
    respuesta += '</table></body></html>'
    return respuesta;
}

