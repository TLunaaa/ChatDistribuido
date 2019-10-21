const http = require('http');
const net = require('net');
const dgram = require('dgram');
const heartbeats = require('heartbeats');
const readlinesync = require('readline-sync');
const readline = require('readline');
const os = require( 'os' );

//Client Data
var MPORT = 33333;
var MHOST = getLocalIP()[0].toString();
//HTTP Server Data
var SPORT = 8080;
var SHOST = '192.168.0.252';
//UDP Server Data
var UPORT = 33335;
var UHOST = getLocalIP()[0].toString();
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
    //console.log("Trying to connect to "+SHOST+":"+MPORT+" via TCP");
    client.connect(33333,SHOST, function() {
        //console.log(">>Connection established");
        t1 = new Date().getTime();
        client.write(t1.toString());
    }); 
    client.on('data', function(data) {
        //console.log(">Receiving Data");
        t4 = (new Date()).getTime();
        t2 = data.toString().split(',')[0];
        t3 = data.toString().split(',')[1];
        
        ServerOffset = ((parseInt(t2)-parseInt(t1))+(parseInt(t3)-parseInt(t4)))/2;
        ServerDelay  = ((parseInt(t2)-parseInt(t1))+(parseInt(t4)-parseInt(t3)))/2;
        //console.log("Offset:"+ServerOffset+" Delay:"+ServerDelay);
        client.destroy();
        //console.log(">>Disconnected");
    });
    client.on('error',function(err){ 
        console.log(err); 
    }) 
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
   
    Object.keys(interfaces).forEach((netInterface) => {
     interfaces[netInterface].forEach((interfaceObject) => {
      if (interfaceObject.family === 'IPv4' && !interfaceObject.internal) {
       addresses.push(interfaceObject.address);
      }
     });
    });
    return addresses;
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
        res.on('error',err =>{ 
            console.log(err); 
        });
    });
    return req;
};

function showConectados(){
    var s = "";
    clientesConectados.forEach(element => {
        s+=element.username.toString()+", ";
    });
    console.log("Conectados: "+s);
}

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
    if ('from' in datos){
        let date = new Date(parseInt(datos.timestamp)+datos.offset),
        udpName = datos.from;
        console.log("["+date.getDay()+"/"+date.getMonth()+"/"+date.getFullYear()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]"+datos.from+":"+datos.message);
        //console.log(dia/mes/año hora:minutos:segundos "mensaje")
    }
});
server.bind(UPORT, UHOST);
//UDP-P2P-Sender
var client = dgram.createSocket('udp4');
console.log("Type /all to send a global message, /exit to exit the chat or /con to see online users.");
rl.on('line',(answer)=>{
    if (answer.toLowerCase() == '/all'){
        rl.question('Mensaje->[All]:',(answer)=>{
            var message = JSON.stringify({
                from: username,
                to : 'all',
                message: answer,
                timestamp: (new Date()).getTime(),
                offset: ServerOffset
            });
            clientesConectados.forEach(element => {
                if(element.ip != MHOST){
                    client.send(message, 0, message.length, UPORT, element.ip, function(err, bytes) {
                        if (err) throw err;
                    });
                }
            });
        });
    }else{
        if (answer == '/exit'){
            client.close();
            rl.close();
        }
        else{
            if (answer == '/con')
                showConectados();
            else
                console.log("Error: Comando desconocido: "+answer);
        }
            
    }
});
