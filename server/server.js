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

const connectionString = "postgres://ihxwdhwhkotwpn:896e9ab3851d12aab58aebd70156570874cad74c177e58e5d5a08eb1b37145f9@ec2-54-235-77-0.compute-1.amazonaws.com:5432/decc1692sdtk6q";

const pool = new Pool({
	connectionString:connectionString,
	ssl: "require",
});

// const pool = new Pool({
//   user: 'postgres',
//   host: '127.0.0.1',
//   database: 'ludodb',
//   password: '123456',
//   port: 5432,
// })

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
		console.log(err);
	} else {
		res.rows.forEach((e) => {
			room_list.push(e.ro_name);
		});
	}
});



io.on('connection',(socket)=>{

	console.log(port);

	socket.emit("hola", "Nate Higgers");

	socket.on("holis", (datos) => {
		console.log(datos);
		socket.emit("hola", "Nate Higgers");
	});

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
					pool.query(text2, values2, (err, res) => {
						if (err){
							console.log(err);
						}
					});

					var player = {
						ids:socket.id,
						idu:datos.u_id,
						idr:datos.ro_id,
						pieza:[
							{
								pos:0,
								vueltaTabl:false,
								nombref:"red1",
								llego: false
							},
							{
								pos:0,
								vueltaTabl:false,
								nombref:"red2",
								llego: false
							},
							{
								pos:0,
								vueltaTabl:false,
								nombref:"red3",
								llego: false
							},
							{
								pos:0,
								vueltaTabl:false,
								nombref:"red4",
								llego: false
							}
						],
						color:"",
						gano: false
					};


					if(players[0] == undefined){
						player.color = 'rojo';
					}

					players.forEach((p) => {
						if(p.color != 'rojo' && p.idr == datos.ro_id){
							player.color = 'rojo';
						} else if(p.color != 'verde' && p.idr == datos.ro_id){
							player.color = 'verde';
						} else if(p.color != 'amarillo' && p.idr == datos.ro_id){
							player.color = 'amarillo';
						} else if(p.color != 'azul' && p.idr == datos.ro_id){
							player.color = 'azul';
						}
					});

					console.log(player);
					players.push(player);
					//console.log(players);

					socket.join(toString(datos.ro_id));
					socket.broadcast.to(toString(datos.ro_id)).emit("actualizarListaUsuarios", JSON.stringify(player));

					callback();

				}
			});
		} else {
			callback("Id de sala no valido");
		}
	});

	socket.on("nuevaPos", (datos,callback) => { //se recibe el nombre de la pieza y el resultado del dado
		
		var player = players.find((e) => e.ids == socket.id);
		var npieza = parseInt(datos.pieza[3]) - 1;

		if(player !== undefined){
			var num = players.indexOf(player);
			if(player.pieza[npieza].pos < 52 && player.pieza[npieza].vueltaTabl == false){

				if(player.color == 'rojo'){
					player.pieza[npieza].pos += datos.pos;
				} else if(player.color == 'verde'){

					player.pieza[npieza].pos += datos.pos;

					if(player.pieza[npieza].pos == 12){
						player.pieza[npieza].vueltaTabl = true;
						player.pieza[npieza].pos = datos.pos;
						players[num] = player;
					}

					
				} else if(player.color == 'azul'){

					player.pieza[npieza].pos += datos.pos;

					if(player.pieza[npieza].pos == 25){
						player.pieza[npieza].vueltaTabl = true;
						player.pieza[npieza].pos = datos.pos;
						players[num] = player;
					}

				} else if(player.color == 'amarillo'){

					player.pieza[npieza].pos += datos.pos;

					if(player.pieza[npieza].pos == 38){
						player.pieza[npieza].vueltaTabl = true;
						player.pieza[npieza].pos = datos.pos;
						players[num] = player;
					}

					
				
			} else if(player.pieza[npieza].pos >= 52 && player.pieza[npieza].vueltaTabl == false){
				if(player.color == 'rojo'){

					player.pieza[npieza].vueltaTabl = true;
					player.pieza[npieza].pos = datos.pos;
					players[num] = player;
					
				} else {

					player.pieza[npieza].pos += datos.pos - 51;
					players[num] = player;
				} 
			}  else if(player.pieza[npieza].vueltaTabl == true) {
					var pos = parseInt(player.pieza[npieza].pos) + datos.pos;

					if(pos === 5){
						player.pieza[npieza].llego = true;
					} else if (pos > 5){
						pos -= 5;
					}

					if(!player.pieza[npieza].llego){
						if(player.color == "rojo"){

							player.pieza[npieza].pos = "red" + toString(pos);
						} else if(player.color == "verde"){
							player.pieza[npieza].pos = "green" + toString(pos);
						} else if(player.color == "azul"){
							player.pieza[npieza].pos = "blue" + toString(pos);
						} else if(player.color == "amarillo"){
							player.pieza[npieza].pos = "yellow" + toString(pos);
						}
					}
					
			}
		}
			
			players[num] = player;
			
			var afuera = {
				pos: toString(player.pieza[npieza].pos),
				vueltaTabl: player.pieza[npieza].vueltaTabl,
				nombref: player.pieza[npieza].nombref,
				llego: player.pieza[npieza].llego,
				dado: datos.pos
			};

			socket.broadcast.to(player.idr).emit("ActualizarPos", JSON.stringify(afuera));

		} else{
			callback("El usuario no se encuentra en la sala");
		}
	});


	//rojo 1 verde 14 amarillo 27 azul 40
	//rojo 52 verde 12 amarillo 25 azul 38

	socket.on("salida", (datos, callback) => {
		
		var player = players.find(e => e.ids == socket.id);
		
		
		var npieza = parseInt(datos.pieza[3]) - 1;
		
		
		if(player !== undefined){
			var num = players.indexOf(player);
			
			var valor = 0;
			
			console.log(player.pieza.p1);
			if(player.color == 'rojo'){

				valor = 1;

			} else if(player.color == 'verde'){
				valor = 14;
				
			
			} else if(player.color == 'amarillo'){
				valor = 25;

			} else if(player.color == 'azul'){
				valor = 40;
			}

			// if (npieza == 1) {
			// 	player.pieza.p1.pos = valor;
			// } else if (npieza == 2) {
			// 	player.pieza.p2.pos = valor;
			// } else if (npieza == 3) {
			// 	player.pieza.p3.pos = valor;
			// } else if (npieza == 4) {
			// 	player.pieza.p4.pos = valor;
			// } 

			if (npieza == 1) {
				player.pieza[0].pos = valor;
			} else if (npieza == 2) {
				player.pieza[1].pos = valor;
			} else if (npieza == 3) {
				player.pieza[2].pos = valor;
			} else if (npieza == 4) {
				player.pieza[3].pos = valor;
			} 

			players[num] = player;
			console.log(player.pieza[0])

			var afuera = {
				pos: toString(valor),
				vueltaTabl: false,
				nombref: datos.pieza,
				llego: false
			};

			socket.broadcast.to(player.idr).emit("ActualizarPos", JSON.stringify(afuera));
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