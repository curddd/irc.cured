const net = require('net');

const PORT = 6667; // IRC default port
const server = net.createServer();

let clients = new Map(); 
let nicks_in_use = [];

server.on('connection', (client) => {

	let guest_nick = guest_+Math.floor(Math.random()*9999999);
	nicks_in_use.push(guest_nick);
	clients.set(client,{nick:guest_nick,channels:[]})

	client.on('data', (data) => {
	console.log(`Received data from client: ${data}`);
	
	
		/*
    		clients.forEach((c) => {
			c.write(`${data}`);
    		});
		*/
	
		let wordArr = data.split(' ');

		switch(wordArr[0]){
			case "JOIN":
				tryJoin(client,wordArr);
			break;
			case "NICK":
				changeNick(client,wordArr);
			break;
		}

  	});

	client.on('end', () => {
		clients.delete(client);
	});
	client.on('error', (e) => {
		console.log("WHOPS",e);
  	});


	
	pInv = setInterval(()=>{
		client.write("PING");
	
});

server.listen(PORT, () => {
	console.log(`IRC server listening on port ${PORT}`);
});


let channels = new Map();

function tryJoin(client,wordArr){
	if(!wordArr[1]){
		return;
	}

	if(wordArr[1].indexOf("#") != 0){
		return;
	}

	let channel = wordArr[1];
	
	if(!channnels.has(channel)){
		channels.set(channel, {users:[client]});
	}
	else{
		let old_channel = channels.get(channel);
		old_channel.users.push(client);
		channels.set(channel, old_channel);
	}
	let old_client = clients.get(client);
	old_client.channels.push(channel);
	clients.set(client,old_client);
}


function changeNick(client,wordArr){
	if(!wordArr[1]){
		return;
	}

	if(nicks_in_use.indexOf(wordArr[1]) != -1 || wordArr[1].indexOf('#'==0)){
		return;
	}

	let new_nick = wordArr[1];	
	let old_client = clients.get(client);
	let old_nick = old_client.nick;
	nicks_in_use.splice(nicks_in_use.indexOf(old_nick,1));
	old.client.nick = new_nick;
	nicks_in_use.push(new_nick);
	bcToAllConnected(client, `${old_nick} changed nick to ${new_nick}`);	
}

function bcToAllConnected(client, msg){
	let client_data = clients.get(client);
	for(let i=0; i<client_data.channels.length;i++){
		sendTo(client_data.channels[i], msg);
	}
}

function sendTo(target, message){
	if(target[0] == '#'){
		let to_send_to = channels.get(target);
		for(let i=0; i<to_send_to.users.length; i++){
			to_send_to.users[i].write(message);
		}
		return;
	}

	clients.get(target).write(message);
}	

