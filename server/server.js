const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const { Pool, Client } = require("pg");

const publicPath = path.join(__dirname, '../public');
var app = express();
const port = process.env.PORT || 3000;
var server = http.createServer(app);
var io = socketIO(server);

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
			    console.log(res.rows[0]);
			  }
			});
		} else{
			callback('No puede haber campos vacios.');
		}
	});

	socket.on('disconnect', ()=>{
		console.log("cliente desconectado");
	});
});

//========================================
//                LISTEN
//========================================
server.listen(port, () => {
	console.log("server started");
});