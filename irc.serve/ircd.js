const net = require('net');

const PORT = 6667; // IRC default port
const server = net.createServer();

let chans_to_conns = new Map();
let conns_to_nicks = new Map();
let nicks_to_conns = new Map();
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
  let user_details = null;

	client.on('data', (data) => {

	  console.log(`Received data from client: ${data}`);

		let inc_msgs = data.toString().replace('\r','').split('\n');

    for(let i=0; i<inc_msgs.length; i++){

      if(inc_msgs[i]==''){
        continue;
      }

      let inc_msg = inc_msgs[i];
      console.log(inc_msg);

      //FIRST NICK MESSAGE

      if(own_nick==null && inc_msg.startsWith("NICK ")){
        
        own_nick = inc_msg.split("NICK ")[1];
        console.log("he has the nick", own_nick, inc_msg.split("NICK "))
        while(full_nick_list.indexOf(own_nick)!=-1){
          own_nick += '_';
        }

        conns_to_nicks.set(client,own_nick);
        nicks_to_conns.set(own_nick,client);
      }
    
      //FIRST USER MESSSAGE
      if(user_details == null && inc_msg.startsWith('USER')){
        user_details = 'some_chatter'
        //send welcome messages
        client.write("IS THSI DATA FFROM WHOM?")
        client.write(`:chatter.today 001 ${own_nick} :Welcome to the IRC server chatter.today\n`);
        client.write(`:chatter.today 002 ${own_nick} :Your host is chatter.today, running version irc.cured\n`);
        client.write(`:chatter.today 003 ${own_nick} :This server was created Sun May 15 2023 at 12:34:56 CEST\n`);
        client.write(`:chatter.today 004 ${own_nick} :chatter.today irc.for.cured.cripples\n`);
        
        client.write(`:chatter.today 375 ${own_nick} :- Welcome to the IRC server!\n`);
        client.write(`:chatter.today 372 ${own_nick} :- If you have any questions or concerns, please contact an operator or administrator.\n`);
        client.write(`:chatter.today 376 ${own_nick} :- End of MOTD.\n`);
      }
         
      if(inc_msg.startsWith("JOIN ")){
        let nick = conns_to_nicks.get(client);
        console.log("nick join", nick)
        tryJoin(client,inc_msg);
      }
        
      if(inc_msg.startsWith("PRIVMSG ")){
        sendMsg(conns_to_nicks.get(client),inc_msg);
      }
      if(inc_msg.startsWith("PING")){
        client.write(":chatter.today PONG\r\n");
      }
          
    }
  });



	client.on('end', () => {
		conns_to_nicks.delete(client);
    nicks_to_conns.delete(own_nick);
	});

	client.on('error', (e) => {
		console.log("WHOPS",e);
  });


	
	
});

server.listen(PORT, () => {
	console.log(`IRC server listening on port ${PORT}`);
});




function sendMsg(from_nick, inc_msg){
  let msg = inc_msg.replace("PRIVMSG ", "");

  if(msg.startsWith('#')){
    sendToChannel(from_nick,msg);
  }
  else{
    nicks.write(`:${from_nick} PRIVMSG ${msg[1]} ${msg[2]}\n`);
  }
}


function tryJoin(client,join_msg){
  console.log("inc",join_msg);

  let channel = join_msg.replace("JOIN ", '');
  //no multi channel join at once
  channel.replace(' ', '_');
  if(!channel.startsWith('#')){
    channel = '#'+channel;
  }
  client.write(`:${conns_to_nicks.get(client)} JOIN :${channel}\r\n`)
  console.log(`:${conns_to_nicks.get(client)} JOIN :${channel}\r\n`);
  //new channel
	if(!chans_to_conns.has(channel)){
		chans_to_conns.set(channel, [client]);
    client.write(`:chatter.today 331 ${conns_to_nicks.get(client)} ${channel} :No topic is set\r\n`);
	}
  //existing channel
	else{
		let old_channel = chans_to_conns.get(channel);
		old_channel.push(client);
		chans_to_conns.set(channel, old_channel);
    
    client.write(`:chatter.today 332 ${conns_to_nicks.get(client)} ${channel} :No Topic, but not new Channel\r\n`);
	}

  //server sends join message / receipt
  //TODO
  //(channel,`:${conns_to_nicks.get(client)} JOIN ${channel}`);
  //get all clients in channel
  let clients_in_chan = chans_to_conns.get(channel);
  for(let i=0; i<clients_in_chan.length; i++){
    //clients_in_chan[i].write(`${conns_to_nicks.get(client)} JOIN ${channel}\n`);
  }
  //list all users in the channel
  let userlist = getAllNicksInChan(channel);
  
  client.write(`:chatter.today 353 ${conns_to_nicks.get(client)} = ${channel} :${userlist}\r\n`);
  client.write(`:chatter.today 366 ${conns_to_nicks.get(client)} ${channel} :End of /NAMES list.\r\n`);

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
  conns_to_nicks.set(client,new_nick);
  nicks_to_conns.delete(old_nick);
  nicks_to_conns.set(new_nick,client);
  return 1;
}


function sendToChannel(source, message){

    let msg = message.split(' :');
    let channel = msg[0];
    msg = msg[1];

		let to_send_to = chans_to_conns.get(channel);
		for(let i=0; i<to_send_to.length; i++){
      if(source == conns_to_nicks.get(to_send_to[i])){
        continue;
      }
			to_send_to[i].write(`:${source} PRIVMSG ${channel} ${msg}\n`);
		}
		return;
}


