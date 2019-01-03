const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const {generateMessage} = require('./utils/message');
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

	socket.emit('newMessage',generateMessage('Admin', 'Welcome to the Chat App'));

	socket.broadcast.emit('newMessage', generateMessage('Admin', 'New user joined'));

	socket.on('createMessage', (message) => {
		console.log('createMessage', message);
		io.emit('newMessage', generateMessage(message.from,message.text));
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