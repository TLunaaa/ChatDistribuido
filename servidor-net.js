var net  = require('net');

const HOST = '192.168.0.102';
const PORT = 33333;

var server = net.createServer(function(socket){
    socket.on('data',function(data){
        var T2 = (new Date()).getTime();
        var T3 = (new Date()).getTime();    
        socket.write(T2.toString()+','+T3.toString());
    })
    socket.on('close',function(data){
        server.close();
    })
})
server.listen(PORT,HOST);

