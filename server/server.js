const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const publicPath = path.join(__dirname, '../public');
var app = express();
const port = process.env.PORT || 3000;
var server = http.createServer(app);
var io = socketIO(server);

app.use(express.static(publicPath));
//========================================
//                SOCKETS
//========================================

io.on('connection',(socket) => {
	console.log('New user connected');

	socket.on('createMessage', (message) => {
		console.log('createMessage', message);
		io.emit('newMessage', {
			from:message.from,
			text:message.text,
			createdAt: new Date().getTime()
		});
	});

	socket.on('disconnect',() => {
		console.log('Client disconnected');
	});
});

//========================================
//                LISTEN
//========================================
server.listen(port, () => {
	console.log("server started");
});

console.log(publicPath);