const http = require('http');
const net = require('./servidor-net');
const url = require('url');

var clientesActivos = [];

const server = http.createServer((request,response) => {
    console.log('somebody connected');
   if(request.method === 'GET'){
        response.statusCode = 200;
        request.on('connect',()=>{
            response.write("Conexion establecida");
        })
        getURL(request.url)
        let data = JSON.stringify(clientesActivos);
        response.end(data);
   }
}).listen(8080);


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
            }
            clientesActivos.push(cliente);
        }
    }
}
