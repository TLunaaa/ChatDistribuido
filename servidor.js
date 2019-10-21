const http = require('http');
const net = require('./servidor-net');
const url = require('url');
const heartbeat = require('heartbeats');
const List = require('collections/list')

var clientesActivos = new List();

const server = http.createServer((request,response) => {
    console.log('>Conexion establecida con: '+ request.socket.remoteAddress);
   if(request.method === 'GET'){
        response.statusCode = 200;
        getURL(request.url)
        let data = JSON.stringify(clientesActivos);
        response.end(data);
   }
}).listen(8080);

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

function getURL(pathurl){
    if(typeof pathurl === 'string'){
        parsedURL = url.parse(pathurl);
        if(parsedURL.pathname === '/register'){
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

