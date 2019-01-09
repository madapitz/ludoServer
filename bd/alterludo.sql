alter table usuario add constraint fk_rol_u FOREIGN KEY (r_id) references rol (r_id) on delete cascade;
alter table usuario add constraint fk_room_u FOREIGN KEY (ro_id) references room (ro_id) on delete cascade;
alter table rol_per add constraint fk_rol_rp FOREIGN KEY (r_id) references rol (r_id) on delete cascade;
alter table rol_per add constraint fk_per_rp FOREIGN KEY (p_id) references permiso (p_id) on delete cascade;

