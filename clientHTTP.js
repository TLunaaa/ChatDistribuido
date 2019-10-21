const http = require('http');
const net = require('net');
const dgram = require('dgram');
const heartbeats = require('heartbeats');
const readlinesync = require('readline-sync');
const readline = require('readline');

//Client Data
var MPORT = 33333;
var MHOST = '192.168.0.12';
//HTTP Server Data
var SPORT = 8080;
var SHOST = '192.168.0.7';
//UDP Server Data
var UPORT = 33335;
var UHOST = '192.168.0.12';
//Variables
var heart = heartbeats.createHeart(10000);
var clientesConectados = [];
var username;
var req;
var ServerDelay; 
var ServerOffset;

//Delay And Offset Calcuation-------------------
var t1,t2,t3,t4;

function TCPconnection(){
    var client = new net.Socket();  //Devuelve un Socket
    console.log("Trying to connect to "+SHOST+":"+MPORT+" via TCP");
    client.connect(33333,SHOST, function() {
        console.log(">>Connection established");
        t1 = new Date().getTime();
        client.write(t1.toString());
    }); 
    client.on('data', function(data) {
        console.log(">Receiving Data");
        t4 = (new Date()).getTime();
        t2 = data.toString().split(',')[0];
        t3 = data.toString().split(',')[1];
        
        ServerOffset = ((parseInt(t2)-parseInt(t1))+(parseInt(t3)-parseInt(t4)))/2;
        ServerDelay  = ((parseInt(t2)-parseInt(t1))+(parseInt(t4)-parseInt(t3)))/2;
        console.log("Offset:"+ServerOffset+" Delay:"+ServerDelay);
        client.destroy();
        console.log(">>Disconnected");
    });
}
//HTTP Register---------------------------------
const options = {
    hostname: SHOST,
    port: SPORT,
    method: 'GET',
    headers: {
        'Content-Type': 'text/plain',
        'Content-Length': 3
    }
}
function register(){
    //console.log("Trying to connect to "+SHOST+":"+SPORT);
    req = http.request(options, (res) => {
        //console.log(`statusCode: ${res.statusCode}`)
        res.setEncoding('utf8');
        clientesConectados = [];
        res.on('data', (chunk) => {
            JSON.parse(chunk).forEach(element => {
                clientesConectados.push(element);
            });
          });
        res.on('end', () => {
        //console.log('Register Closed');
        });
    });
    return req;
};

username = readlinesync.question('Ingrese su nombre de usuario: ');
console.log("Bienvenido "+username);
options.path = '/register?username='+username+'&ip='+MHOST+'&port='+SPORT;
TCPconnection();
register().end();
heart.createEvent(1,(count,last)=>{
    register().end();
})

//Format the request and ends it
//UDP-P2P-Listener

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
var server = dgram.createSocket('udp4');
server.on('message', function (message, remote) {
    var datos = JSON.parse(message);
    if ('username' in datos){
        udpName = datos.username;
        console.log("Conected with: "+datos.username+" in: "+remote.address+":"+remote.port+":"+datos.msg);
        //console.log(dia/mes/año hora:minutos:segundos "mensaje")
    }
});
server.bind(UPORT, UHOST);
//UDP-P2P-Sender
var client = dgram.createSocket('udp4');
console.log("Type /All to send a global message, /exit to exit the chat");
rl.on('line',(answer)=>{
    if (answer == '/All'){
        rl.question('Mensaje->[All]:',(answer)=>{
            var message = JSON.stringify({
                msg : answer,
                username : username
                //asi deberias ser el formato de envio de mensaje ->
                //from:
                //to:
                //message:
                //timestamp:
                //offset:
            });
            clientesConectados.forEach(element => {
                client.send(message, 0, message.length, UPORT, element.ip, function(err, bytes) {
                    if (err) throw err;
                    client.close();
                });
            });
        });
    }else{
        if (answer == '/exit')
            rl.close();
    }
});
