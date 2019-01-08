const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const { Pool, Client } = require("pg");

const {Users} = require('./utils/users');
const publicPath = path.join(__dirname, '../public');
var app = express();
const port = process.env.PORT || 3000;
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(express.static(publicPath));

//========================================
//                CONEXION BD
//========================================
const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'ludodb',
  password: '123456',
  port: 5432,
})

// pool.query('SELECT * FROM rol', (err, res) => {
//   console.log(err, res)
//   pool.end()
// })

//========================================
//                SOCKETS
//========================================

io.on('connection',(socket)=>{

	socket.on('registro', (datos, callback)=>{
		var text = 'INSERT INTO usuario(u_name,u_password) VALUES ($1,$2) RETURNING *';

		if (datos.nombre !== "" && datos.password !== "") {
			var values = [datos.nombre, datos.password]; 

			pool.query(text, values, (err, res) => {
			  if (err) {
			    callback('El nombre de usuario ya esta en uso');
			  } else {
			  	var redir = {
			  		dirc:"/partidas.html"
			  	};
			  	users.addUser(socket.id, datos.nombre, null);
			    socket.emit('redirect',redir);
			  }
			});
		} else{
			callback('No puede haber campos vacios.');
		}
	});

	socket.on('entrar', (datos, callback)=>{
		var text = 'SELECT u_name, u_password FROM usuario WHERE u_name=$1 AND u_password=$2';

		if (datos.nombre !== "" && datos.password !== "") {
			var values = [datos.nombre, datos.password]; 
			pool.query(text, values, (err, res) => {
				if (res.rows[0] == undefined) {
			    callback('Nombre de usuario o contrasena incorrecta');
			  } else {
			  	var redir = {
			  		dirc:"/partidas.html"
			  	};
			  	users.addUser(socket.id, datos.nombre, null);
			    socket.emit('redirect',redir);
			  }
			});
		} else{
			callback('No puede haber campos vacios.');
		}
	});

	socket.on('disconnect', ()=>{
		users.removeUser(socket.id);
	});
});

//========================================
//                LISTEN
//========================================
server.listen(port, () => {
	console.log("server started");
});