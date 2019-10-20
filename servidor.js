const http = require('http');
const net = require('./servidor-net');
const url = require('url');
const heartbeat = require('heartbeats');

var clientesActivos = [];

const server = http.createServer((request,response) => {
    console.log('Conexion establecida');
   if(request.method === 'GET'){
        response.statusCode = 200;
        getURL(request.url)
        let data = JSON.stringify(clientesActivos);
        response.end(data);
   }
}).listen(8080);

var heart = heartbeat.createHeart(5000);


function getURL(pathurl){
    if(typeof pathurl === 'string'){
        parsedURL = url.parse(pathurl);
        if(parsedURL.pathname === '/register'){
            console.log(parsedURL.query)
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
                let clientAux = element;
                if(clientAux.ip == ip ){
                    esta = true;
                    clientAux.timestamp = (new Date()).getTime();
                }
            })
            if(esta == false){
                clientesActivos.push(cliente);
            }
            console.log(clientesActivos);
        }
    }
}

