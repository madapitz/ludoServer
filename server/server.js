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

// const pool = new Pool({
//   user: 'ihxwdhwhkotwpn',
//   host: 'ec2-54-235-77-0.compute-1.amazonaws.com',
//   database: 'decc1692sdtk6q',
//   password: '896e9ab3851d12aab58aebd70156570874cad74c177e58e5d5a08eb1b37145f9',
//   port: 5432,
//   ssl: "require"
// });

// pool.query('SELECT * FROM rol', (err, res) => {
//   console.log(err, res)
//   pool.end()
// })

//========================================
//                SOCKETS
//========================================

var room_list = [];
var players = [];

pool.query('SELECT ro_name FROM room', (err, res) => {
	if (err) {
		console.log("error");
	} else {
		res.rows.forEach((e) => {
			room_list.push(e.ro_name);
		});
	}
});



io.on('connection',(socket)=>{

	console.log(port);

	socket.on("hola", "Nate Higgers");

	socket.on('registro', (datos, callback)=>{
		var text = 'INSERT INTO usuario(u_name,u_password) VALUES ($1,$2) RETURNING *';

		if (datos.nombre !== "" && datos.password !== "") {
			var values = [datos.nombre, datos.password]; 

			pool.query(text, values, (err, res) => {
			  if (err) {
			    callback('El nombre de usuario ya esta en uso');
			  } else {
			  	var redir = {
			  		dirc:"/partidas.html" //quitar
			  	};
			  	
			    socket.emit('redirect',redir); //quitar 
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
			  	var redir = { //Quitar cuando se pruebe para el juego
			  		dirc:"/partidas.html"
			  	};
			  	
			  	socket.emit('updateRoomList', room_list);
			    //socket.emit('redirect',redir);
			  }
			});
		} else{
			callback('No puede haber campos vacios.');
		}
	});

	socket.on("entrarSala", (datos, callback) => { //se debe pasar el id de la sala
		var text = 'SELECT count(u_id) FROM usuario u WHERE ro_id=$1';

		if (datos.ro_id >= 1) {
			var values = [datos.ro_id];
			pool.query(text, values, (err, res) => {
				if (parseInt(res.rows[0]) >= 4) {
					callback("Sala llena");
				} else {
					var text2 = "UPDATE usuario SET ro_id=$1 WHERE u_id=$2";
					var values2 = [datos.ro_id, datos.u_id];
					pool.query(text2, values2);

					var player = {
						ids:socket.id,
						idu:datos.u_id,
						idr:datos.ro_id,
						pieza:{
							p1pos:0,
							p2pos:0,
							p3pos:0,
							p4pos:0
						},
						color:"",
						vueltaTabl: false
					};

					players.push(player);

					socket.join(ro_id);
					socket.to(ro_id).broadcast("actualizarListaUsuarios", JSON.stringify(player));

				}
			});
		} else {
			callback("Id de sala no valido");
		}
	});

	socket.on("nuevaPos", (datos,callback) => {
		var player = players.find((e) => e.ids == socket.id);
		if(player !== undefined){
			var num = players.indexOf(player);
			if(datos.pos < 52){
				if(player.color == 'rojo'){
					if (datos.pieza == 'red1') {
						players[num].pieza.p1pos += datos.pos;
					} else if (datos.pieza == 'red2') {
						players[num].pieza.p2pos += datos.pos;
					} else if (datos.pieza == 'red3') {
						players[num].pieza.p3pos += datos.pos;
					} else if (datos.pieza == 'red4') {
						players[num].pieza.p4pos += datos.pos;
					}
				} else if(player.color == 'verde'){
					if (datos.pieza == 'red1') {
						players[num].pieza.p1pos += datos.pos;
					} else if (datos.pieza == 'red2') {
						players[num].pieza.p2pos += datos.pos;
					} else if (datos.pieza == 'red3') {
						players[num].pieza.p3pos += datos.pos;
					} else if (datos.pieza == 'red4') {
						players[num].pieza.p4pos += datos.pos;
					}
				} else if(player.color == 'azul'){
					if (datos.pieza == 'red1') {
						players[num].pieza.p1pos += datos.pos;
					} else if (datos.pieza == 'red2') {
						players[num].pieza.p2pos += datos.pos;
					} else if (datos.pieza == 'red3') {
						players[num].pieza.p3pos += datos.pos;
					} else if (datos.pieza == 'red4') {
						players[num].pieza.p4pos += datos.pos;
					}
				} else if(player.color == 'amarillo'){
					if (datos.pieza == 'red1') {
						players[num].pieza.p1pos += datos.pos;
					} else if (datos.pieza == 'red2') {
						players[num].pieza.p2pos += datos.pos;
					} else if (datos.pieza == 'red3') {
						players[num].pieza.p3pos += datos.pos;
					} else if (datos.pieza == 'red4') {
						players[num].pieza.p4pos += datos.pos;
					}
				}
			} else {
				if(player.color == 'rojo'){

					players[num].vueltaTabl = true;

					if (datos.pieza == 'red1') {
						players[num].pieza.p1pos += datos.pos -51;
					} else if (datos.pieza == 'red2') {
						players[num].pieza.p2pos += datos.pos -51;
					} else if (datos.pieza == 'red3') {
						players[num].pieza.p3pos += datos.pos -51;
					} else if (datos.pieza == 'red4') {
						players[num].pieza.p4pos += datos.pos -51;
					}
				} else if(player.color == 'verde'){

					if(datos.pos - 51 >= 12){players[num].vueltaTabl = true;}

					if (datos.pieza == 'red1') {
						players[num].pieza.p1pos += datos.pos - 51;
					} else if (datos.pieza == 'red2') {
						players[num].pieza.p2pos += datos.pos - 51;
					} else if (datos.pieza == 'red3') {
						players[num].pieza.p3pos += datos.pos - 51;
					} else if (datos.pieza == 'red4') {
						players[num].pieza.p4pos += datos.pos - 51;
					}
				} else if(player.color == 'azul'){

					if(datos.pos - 51 >= 25){players[num].vueltaTabl = true;}

					if (datos.pieza == 'red1') {
						players[num].pieza.p1pos += datos.pos - 51;
					} else if (datos.pieza == 'red2') {
						players[num].pieza.p2pos += datos.pos - 51;
					} else if (datos.pieza == 'red3') {
						players[num].pieza.p3pos += datos.pos - 51;
					} else if (datos.pieza == 'red4') {
						players[num].pieza.p4pos += datos.pos - 51;
					}
				} else if(player.color == 'amarillo'){

					if(datos.pos - 51 >= 12){players[num].vueltaTabl = true;}

					if (datos.pieza == 'red1') {
						players[num].pieza.p1pos += datos.pos - 51;
					} else if (datos.pieza == 'red2') {
						players[num].pieza.p2pos += datos.pos - 51;
					} else if (datos.pieza == 'red3') {
						players[num].pieza.p3pos += datos.pos - 51;
					} else if (datos.pieza == 'red4') {
						players[num].pieza.p4pos += datos.pos - 51;
					}
				}

			}
			

			socket.to(player.idr).broadcast("ActualizarPos", JSON.stringify(player[num]));
		} else{
			callback("El usuario no se encuentra en la sala");
		}
	});


	//rojo 1 verde 14 amarillo 27 azul 40
	//rojo 52 verde 12 amarillo 25 azul 38

	socket.on("salida", (datos, callback) => {
		var player = players.find((e) => e.ids == socket.id);
		if(player !== undefined){
			var num = players.indexOf(player);
			if(datos.color == 'rojo'){
				if (datos.pieza == "Red1") {
					players[num].pieza.p1pos = 1;
				} else if (datos.pieza == "Red2") {
					players[num].pieza.p2pos = 1;
				} else if (datos.pieza == "Red3") {
					players[num].pieza.p3pos = 1;
				} else if (datos.pieza == "Red4") {
					players[num].pieza.p4pos = 1;
				}
			} else if(datos.color == 'verde'){
				if (datos.pieza == "Red1") {
					players[num].pieza.p1pos = 14;
				} else if (datos.pieza == "Red2") {
					players[num].pieza.p2pos = 14;
				} else if (datos.pieza == "Red3") {
					players[num].pieza.p3pos = 14;
				} else if (datos.pieza == "Red4") {
					players[num].pieza.p4pos = 14;
				}
			} else if(datos.color == 'amarillo'){
				if (datos.pieza == "Red1") {
					players[num].pieza.p1pos = 25;
				} else if (datos.pieza == "Red2") {
					players[num].pieza.p2pos = 25;
				} else if (datos.pieza == "Red3") {
					players[num].pieza.p3pos = 25;
				} else if (datos.pieza == "Red4") {
					players[num].pieza.p4pos = 25;
				} 
			} else if(datos.color == 'azul'){
				if (datos.pieza == "Red1") {
					players[num].pieza.p1pos = 40;
				} else if (datos.pieza == "Red2") {
					players[num].pieza.p2pos = 40;
				} else if (datos.pieza == "Red3") {
					players[num].pieza.p3pos = 40;
				} else if (datos.pieza == "Red4") {
					players[num].pieza.p4pos = 40;
				}
			}
			socket.to(player.idr).broadcast("ActualizarPos", JSON.stringify(player[num]));
		} else{
			callback("Error");
		}
	});


	socket.on("elegirColor", (datos, callback) => {
		var player = players.find((e) => e.ids == socket.id);
		if(player !== undefined){
			var num = players.indexOf(player);
			players[num].color = datos.color;
		} else {
			callback("El usuario no se encuentra en la sala");
		}
	});



	socket.on('disconnect', ()=>{
		var player = players.find((e) => e.ids == socket.id);
		if(player !== undefined){
			players = players.filter((e) => e.ids != socket.id);
			var text = "UPDATE usuario SET ro_id=NULL WHERE u_id=$1";
			var values = [];
		}
	});
});

//========================================
//                LISTEN
//========================================
server.listen(port, () => {
	console.log("server started");
});