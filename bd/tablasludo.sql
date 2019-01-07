create table usuario(
	u_id serial,
	u_name varchar(20) not null unique,
	u_password varchar(20) not null,
	r_id integer,
	constraint pk_jugador PRIMARY KEY (u_id)
);

create table rol(
	r_id serial,
	r_name varchar(20) not null unique,
	constraint pk_rol PRIMARY KEY (r_id)
);

create table permiso(
	p_id serial,
	p_name varchar(20) not null unique,
	constraint pk_per PRIMARY KEY (p_id)
);

create table rol_per(
	r_id integer not null,
	p_id integer not null
);


