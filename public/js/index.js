var socket = io();

socket.on('redirect', function(datos){
	window.location.href = datos.dirc;
});

// socket.emit("entrarSala", {ro_id:1,u_id:1}, function(){socket.emit("salida", {pieza:'red1',pos:1});});


// socket.on('updateUserList', function(users){
//   var ol = $('<ol></ol>');
//   users.forEach(function(user){
//     ol.append($('<li></li>').text(user));
//   });

//   $('#users').html(ol);
// });

socket.on('updateRoomList', function(rooms){
	var ul = $('<ul></ul>');
	rooms.forEach(function(room){
		ul.append($('<li></li>').text(room));
	});

	$('#partidas').html(ul);
});

$('#registro').on('submit', function (e) {
	e.preventDefault();
	var datos = {
		nombre: $('[name=nombre]').val(),
		password: $('[name=contrasena]').val()
	};
	// var nombre = $('[name=nombre]').val();
	// var con = $('[name=nombre]').val();
	socket.emit('registro', datos, function (err){
		alert(err);
	});
});

$('#entrar').on('submit', function (e) {
	e.preventDefault();
	var datos = {
		nombre: $('[name=nombre]').val(),
		password: $('[name=contrasena]').val()
	};
	// var nombre = $('[name=nombre]').val();
	// var con = $('[name=nombre]').val();
	socket.emit('entrar', datos, function (err){
		alert(err);
	});
});