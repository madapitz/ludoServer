var socket = io();

socket.on('redirect', function(datos){
	window.location.href = datos.dirc;
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