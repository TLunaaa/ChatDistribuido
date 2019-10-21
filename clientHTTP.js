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
var SHOST = '192.168.43.90';
//UDP Server Data
var UPORT = 33335;
var UHOST = getLocalIP()[0].toString();
//Variables
var heart = heartbeats.createHeart(60000);
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
        console.log('err'); 
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
    console.log("Connected users: "+s);
}

username = readlinesync.question('Enter your username: ');
options.path = '/register?username='+username+'&ip='+MHOST+'&port='+SPORT;
TCPconnection();
register().end();
heart.createEvent(1,(count,last)=>{
    TCPconnection();
    register().end();
})

//UDP-P2P-Listener

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var server = dgram.createSocket('udp4');
server.on('message', function (message, remote) {
    var datos = JSON.parse(message);
    if (datos.to == 'all' || datos.to == username){
        let date = new Date(parseInt(datos.timestamp)+datos.offset),
        udpName = datos.from;
        upperName = datos.from.charAt(0).toUpperCase() + datos.from.slice(1)
        console.log("["+date.getDay().toString().padStart(2,'0')+
        "/"+date.getMonth().toString().padStart(2,'0')+
        "/"+date.getFullYear()+
        " "+date.getHours().toString().padStart(2,'0')+
        ":"+date.getMinutes().toString().padStart(2,'0')+
        ":"+date.getSeconds().toString().padStart(2,'0')+
        "] "+upperName+": "+datos.message);
        //console.log(dia/mes/año hora:minutos:segundos "mensaje")
    }
});
server.bind(UPORT, UHOST);
//UDP-P2P-Sender
var client = dgram.createSocket('udp4');
console.log("Welcome "+username+", type /help to see all commands.");
rl.on('line',(answer)=>{
    if (answer.toLowerCase() == '/all'){
        rl.question('->[All]:',(answer)=>{
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
        if (answer.toLowerCase() == '/netstat'){
            console.log('Delay: '+ServerDelay+"ms | Offset: "+ServerOffset+"ms.");
        }
        else{
            if (answer.toLowerCase() == '/con')
                showConectados();
            else{
                if (answer.toLowerCase() == '/exit'){
                    client.close();
                    rl.close();
                    heart.kill();
                    server.close();
                }
                else{
                    if (answer.toLowerCase() == '/help'){
                        console.log("  /dm to send a direct message to a connected user");
                        console.log("  /all to send a global message");
                        console.log("  /con to see online users");
                        console.log("  /netstat to see network stats");
                        console.log("  /exit to end program.");
                    }else{
                        if(answer.toLowerCase()== '/dm'){
                           rl.question("to:",(answer)=>{
                               var towho = answer;
                               var isConnected = false;
                               rl.question("->["+answer+"]:",(answer)=>{
                                    var message = JSON.stringify({
                                        from: username,
                                        to : towho,
                                        message: answer,
                                        timestamp: (new Date()).getTime(),
                                        offset: ServerOffset
                                    });
                                    clientesConectados.forEach(element => {
                                        if(element.ip != MHOST && element.username.toLowerCase() == towho.toLowerCase()){
                                            isConnected = true;
                                            client.send(message, 0, message.length, UPORT, element.ip, function(err, bytes) {
                                                if (err) throw err;
                                            });
                                        }
                                        if(!isConnected){
                                            console.log("Error -> User <"+towho+"> not connected: ");
                                        } 
                                    });
                                });
                            });
                        }else{
                            console.log("Error -> Unknown command: "+answer);
                        }
                        
                    }
                }

            }
        }
            
    }
});
