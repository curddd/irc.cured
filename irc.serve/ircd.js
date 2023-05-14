const net = require('net');

const PORT = 6667; // IRC default port
const server = net.createServer();

let chans_to_conns = new Map();
let conns_to_nicks = new Map();
let full_nick_list = [];

function getAllNicksInChan(chan){
  let conns = chans_to_conns.get(chan);
  let nicks = [];
  for(let i=0; i<conns.length; i++){
    nicks.push(conns_to_nicks.get(conns[i]));
  }
  return nicks;
}



server.on('connection', (client) => {
  let own_nick = null;
	client.on('data', (data) => {
	  console.log(`Received data from client: ${data}`);
		let inc_msgs = data.toString().split('\n');

    for(let i=0; i<inc_msgs.length; i++){
      if(inc_msgs[i]==''){
        continue;
      }
      let inc_msg = inc_msgs[i].split(' ');
      console.log(inc_msg);
      if(own_nick==null){
        if(inc_msg[0] == 'NICK' && inc_msg.length==2 && inc_msg[1][0]!='#'){
          //set nick
          own_nick = inc_msg[1];

          while(full_nick_list.indexOf(own_nick)!=-1){
            own_nick += '_';
          }

          conns_to_nicks.set(client,own_nick);
          //send welcome messages
          client.write(`:chatter.today 001 ${own_nick} :Welcome to the IRC server chatter.today\n`);
          client.write(`:chatter.today 002 ${own_nick} :Your host is chatter.today, running version irc.cured\n`);
          client.write(`:chatter.today 003 ${own_nick} :This server was created Sun May 15 2023 at 12:34:56 CEST\n`);
          client.write(`:chatter.today 004 ${own_nick} :chatter.today irc.for.cured.cripples\n`);
          
          client.write(`:chatter.today 375 ${own_nick} :- Welcome to the IRC server!\n`);
          client.write(`:chatter.today 372 ${own_nick} :- If you have any questions or concerns, please contact an operator or administrator.\n`);
          client.write(`:chatter.today 376 ${own_nick} :- End of MOTD.\n`);
        }
      }


      switch(inc_msg[0]){
        case "JOIN":
          tryJoin(client,inc_msg);
        break;
        case "NICK":
          let changed = changeNick(client,inc_msg);
          if(changed){
            own_nick = inc_msg[1];
          }
        break;
        case "PRIVMSG":
          sendMsg(conns_to_nicks.get(client),inc_msg);
        break;
        case "PING":
          client.write("PONG\n");
        break;
      }
    }
  });



	client.on('end', () => {
		clients.delete(client);
	});

	client.on('error', (e) => {
		console.log("WHOPS",e);
  });


	
	
});

server.listen(PORT, () => {
	console.log(`IRC server listening on port ${PORT}`);
});




function sendMsg(from_nick, msg){
  sendToChannel(from_nick,msg[1],msg[2]);
}

let channels = new Map();

function tryJoin(client,wordArr){
  console.log("inc",wordArr);
	let channel = wordArr[1].split(':')[0];
	if(!channel[0]=='#'){
		return;
	}

  //new channel
	if(!chans_to_conns.has(channel)){
		chans_to_conns.set(channel, [client]);
    client.write(`:chatter.today 331 ${conns_to_nicks.get(client)} ${channel} :No topic is set\n`);
	}
  //existing channel
	else{
		let old_channel = chans_to_conns.get(channel);
		old_channel.push(client);
		chans_to_conns.set(channel, old_channel);
    
    client.write(`:chatter.today 332 ${conns_to_nicks.get(client)} ${channel} :No Topic, but not new Channel\n`);
	}

  //server sends join message / receipt
  //TODO
  //sendToChannel(channel,`:${clients.get(client).nick} JOIN ${channel}`);
  //list all users in the channel
  let userlist = getAllNicksInChan(channel);
  
  client.write(`:chatter.today 353 ${conns_to_nicks.get(client)} = ${channel} :${userlist}\n`);
  client.write(`:chatter.today 366 ${conns_to_nicks.get(client)} ${channel} :End of /NAMES list.\n`);

}


function changeNick(client,wordArr){
	if(!wordArr[1]){
		return 0;
	}


  let new_nick = wordArr[1];
	if(full_nick_list.includes(new_nick) || new_nick.indexOf('#'==0)){
		return 0;
	}

  let old_nick = conns_to_nicks.get(client);
  full_nick_list.splice(full_nick_list.indexOf(old_nick),1);
  full_nick_list.push(new_nick);

	bcToAllConnected(client, `${old_nick} changed nick to ${new_nick}`);
  return 1;
}

function bcToAllConnected(client, msg){
	let client_data = clients.get(client);
	for(let i=0; i<client_data.channels.length;i++){
		sendTo(client_data.channels[i], msg);
	}
}

function sendToChannel(source, target, message){
		let to_send_to = chans_to_conns.get(target);
		for(let i=0; i<to_send_to.length; i++){
      if(source == conns_to_nicks.get(to_send_to[i])){
        continue;
      }
			to_send_to[i].write(`:${source} PRIVMSG ${target} ${message}\n`);
		}
		return;
}


