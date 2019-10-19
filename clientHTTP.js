const http = require('http');
const net = require('net');
var dgram = require('dgram');


//Client Datas
var MPORT = 33333;
var MHOST = '192.168.0.123';
//HTTP Server Data
var SPORT = 8080;
var SHOST = '192.168.0.147';
//User Data
var username = 'nescu';
var req;
var ServerDelay; 
var ServerOffset;

//Delay And Offset Calcuation-------------------
var t1,t2,t3,t4;
var client = new net.Socket();  //Devuelve un Socket
client.connect(33333,SHOST, function() {
    t1 = new Date().getTime();
    client.write(t1.toString());
}); 
client.on('data', function(data) {
    t4 = (new Date()).getTime();
    t2 = data.toString().split(',')[0];
    t3 = data.toString().split(',')[1];
    
    ServerOffset = ((parseInt(t2)-parseInt(t1))+(parseInt(t3)-parseInt(t4)))/2;
    ServerDelay  = ((parseInt(t2)-parseInt(t1))+(parseInt(t4)-parseInt(t3)))/2;
    console.log("Offset:"+ServerOffset+" Delay:"+ServerDelay);
    client.destroy();
});
//HTTP Register---------------------------------
const options = {
    hostname: SHOST,
    port: SPORT,
    path: '/register',
    method: 'GET',
    headers: {
        'Content-Type': 'text/plain',
        'Content-Length': 3
    }
}
function send(){
    req = http.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`)
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            JSON.parse(chunk).forEach(element => {
                console.log(element);
            });
          });
          res.on('end', () => {
            console.log('Register Closed');
          });
    });
    return req;
};
options.path = '/register?username='+username+'&ip='+MHOST+'&port='+MPORT;
send().end();   //Format the request and ends it
//UDP-P2P-Listener
var server = dgram.createSocket('udp4');
server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});
