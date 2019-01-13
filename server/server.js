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
						pieza:{
							p1:{
								pos:0,
								vueltaTabl:false,
								nombref:"red1",
								llego: false
							},
							p2:{
								pos:0,
								vueltaTabl:false,
								nombref:"red2",
								llego: false
							},
							p3:{
								pos:0,
								vueltaTabl:false,
								nombref:"red3",
								llego: false
							},
							p4:{
								pos:0,
								vueltaTabl:false,
								nombref:"red4",
								llego: false
							}
						},
						color:"",
						gano: false
					};

					players.push(player);

					socket.join(toString(datos.ro_id));
					socket.broadcast.to(toString(datos.ro_id)).emit("actualizarListaUsuarios", JSON.stringify(player));

				}
			});
		} else {
			callback("Id de sala no valido");
		}
	});

	socket.on("nuevaPos", (datos,callback) => { //se recibe el nombre de la pieza y el resultado del dado
		
		var player = players.find((e) => e.ids == socket.id);
		var playerDict = {
			"red1":player.pieza.p1,
			"red2":player.pieza.p2,
			"red3":player.pieza.p3,
			"red4":player.pieza.p4
		};
		if(player !== undefined){
			var num = players.indexOf(player);
			if(player.pos < 52 && playerDict[datos.pieza].vueltaTabl == false){

				if(player.color == 'rojo'){
					playerDict[datos.pieza].pos += datos.pos;
				} else if(player.color == 'verde'){

					playerDict[datos.pieza].pos += datos.pos;

					if(playerDict[datos.pieza].pos == 12){
						playerDict[datos.pieza].vueltaTabl = true;
						playerDict[datos.pieza].pos = datos.pos;
						players[num] = player;
					}

					
				} else if(player.color == 'azul'){

					playerDict[datos.pieza].pos += datos.pos;

					if(playerDict[datos.pieza].pos == 25){
						playerDict[datos.pieza].vueltaTabl = true;
						playerDict[datos.pieza].pos = datos.pos;
						players[num] = player;
					}

				} else if(player.color == 'amarillo'){

					playerDict[datos.pieza].pos += datos.pos;

					if(playerDict[datos.pieza].pos == 38){
						playerDict[datos.pieza].vueltaTabl = true;
						playerDict[datos.pieza].pos = datos.pos;
						players[num] = player;
					}

					
				
			} else if(player.pos >= 52 && playerDict[datos.pieza].vueltaTabl == false){
				if(player.color == 'rojo'){

					playerDict[pieza].vueltaTabl = true;
					playerDict[datos.pieza].pos = datos.pos;
					players[num] = player;
					
				} else {

					playerDict[datos.pieza].pos += datos.pos - 51;
					players[num] = player;
				} 
			}  else if(playerDict[datos.pieza].vueltaTabl == true) {
					var pos = parseInt(playerDict[pieza].pos) + datos.pos;

					if(pos === 5){
						playerDict[datos.pieza].llego = true;
					} else if (pos > 5){
						pos -= 5;
					}

					if(!playerDict[datos.pieza].llego){
						if(player.color == "rojo"){

							playerDict[pieza].pos = "red" + toString(pos);
						} else if(player.color == "verde"){
							playerDict[pieza].pos = "green" + toString(pos);
						} else if(player.color == "azul"){
							playerDict[pieza].pos = "blue" + toString(pos);
						} else if(player.color == "amarillo"){
							playerDict[pieza].pos = "yellow" + toString(pos);
						}
					}
					players[num] = player;
			}
		}
			
			
			var afuera = {
				pos: toString(playerDict[datos.pieza].pos),
				vueltaTabl: playerDict[datos.pieza].vueltaTabl,
				nombref: playerDict[datos.pieza].nombref,
				llego: playerDict[datos.pieza].llego,
				dado: datos.pos
			};

			socket.to(player.idr).broadcast("ActualizarPos", JSON.stringify(afuera));
		} else{
			callback("El usuario no se encuentra en la sala");
		}
	});


	//rojo 1 verde 14 amarillo 27 azul 40
	//rojo 52 verde 12 amarillo 25 azul 38

	socket.on("salida", (datos, callback) => {
		
		var player = players.find((e) => e.ids == socket.id);
		var playerDict = {
			"red1":player.pieza.p1,
			"red2":player.pieza.p2,
			"red3":player.pieza.p3,
			"red4":player.pieza.p4
		};
		if(player !== undefined){
			var num = players.indexOf(player);
			playerDict[datos.pieza].pos = 1;
			if(player.color == 'rojo'){

				playerDict[datos.pieza].pos = 1;

			} else if(player.color == 'verde'){
				playerDict[datos.pieza].pos = 14;
				
			
			} else if(player.color == 'amarillo'){
				playerDict[datos.pieza].pos = 25;

			} else if(player.color == 'azul'){
				playerDict[datos.pieza].pos = 40;
			}

			players[num] = player;

			var afuera = {
				pos: toString(playerDict[datos.pieza].pos),
				vueltaTabl: playerDict[datos.pieza].vueltaTabl,
				nombref: playerDict[datos.pieza].nombref,
				llego: playerDict[datos.pieza].llego
			};

			socket.to(player.idr).broadcast("ActualizarPos", JSON.stringify(afuera));
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