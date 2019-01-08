class Users {
	constructor(){
		this.users = [];
	}

	addUser(id, name, room){
		var user = {id, name, room};
		this.users.push(user);
		return user;
	}

	removeUser(id){
		//return user that was removed
		var user = this.getUser(id);
		if (user) {
			this.users = this.users.filter((user) => user.id !== id);
		}

		return user;
	}

	cambiarRoom(id, room){
		//se usa el id para buscar al usuario y se cambia el room donde se encuentra
		var user = this.removeUser(id);
		if(user){
			this.addUser(id, user.name, room);
		}
	}

	getUser(id){
		return this.users.filter((user) => user.id === id)[0];
	}


	getUserList(room){
		var users = this.users.filter((user) => user.room === room);
		var namesArray = users.map((user) => user.name);
		return namesArray;
	}
}

module.exports = {Users};