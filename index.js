
module.exports = require('./lib/express');


var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var people = {};
var peopleName = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  socket.on('disconnect', function(){

    console.log('user disconnected');

    var joinName = peopleName[socket.id];
    if (joinName != undefined) {
        var res = joinName.split(":");
        var name = res[0];
        var roomName = res[1];

        var roomClients = people[roomName];
        delete peopleName[socket.id];
        delete roomClients[socket.id];
        people[roomName] = roomClients;

        socket.leave(roomName);
        
        io.sockets.in(roomName).emit("update", name + " has left the room : " + roomName);
        delete people[socket.id];
        io.sockets.in(roomName).emit("update-people", roomClients);
    }
  });


 socket.on('send', function(msg){
     console.log('message: ' + msg);

     var joinName = peopleName[socket.id];
     var res = joinName.split(":");
     var name = res[0];
     var roomName = res[1];

     io.sockets.in(roomName).emit("chat", name, msg);

     var clients_in_the_room = io.sockets.adapter.rooms[roomName];
     for (var clientId in clients_in_the_room) {
         console.log('client: %s', clientId); //Seeing is believing 
         var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
     }


  });

socket.on("join", function(joinName){

    if (joinName != undefined) {
        var res = joinName.split(":");
        var name = res[0];
        var roomName = res[1];
        socket.join(roomName);

        peopleName[socket.id] = joinName;

        var roomClients = people[roomName];
        if (roomClients == undefined) {
            roomClients = {};
            roomClients[socket.id] = name;
        }
        else {
            roomClients[socket.id] = name;
        }
        people[roomName] = roomClients;

        io.sockets.in(roomName).emit("update", name + " has joined the room : " + roomName)
        io.sockets.in(roomName).emit("update-people", roomClients);
    }
});

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});