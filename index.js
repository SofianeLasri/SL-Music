// Configuration
const config = require('./config');
// Driver SQL
const Sequelize = require('sequelize');
const { Op } = require("sequelize");
// Couleurs de la console
var colors = require('colors');

// API discord
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

// Moment JS
var moment = require('moment');  

////////////////////////////////////////////////////////////////
// MODELES DES TABLES
////////////////////////////////////////////////////////////////

// Connexion à la base de données
const sequelize = new Sequelize(config.get("BDD_NAME"), config.get("BDD_USER"), config.get("BDD_PASSWORD"), {
	host: config.get("BDD_HOST"),
	dialect: 'mariadb',
	logging: false,
});

// Paramètres du bot
const botSettings = sequelize.define('bot_settings', {
	name: { type: Sequelize.STRING(128), primaryKey: true },
	value: Sequelize.STRING(512),
}, {
	timestamps: false
});

// Paramètres des membres
const memberSettings = sequelize.define('bot_memberSettings', {
	memberId: { type: Sequelize.BIGINT(255), primaryKey: true },
	name: { type: Sequelize.STRING(128), primaryKey: true },
	value: Sequelize.STRING(512),
}, {
	timestamps: false
});


////////////////////////////////////////////////////////////////

const commands = [{
	name: 'ping',
	description: 'Répond avec pong!'
},
{
	name: 'play',
	description: 'Permet de jouer une musique.',
	options: [{
		name: "titre", // no uppercase as well
		description: "Titre de la vidéo sur YouTube",
		type: 3,
		required: true
	}]
},
{
	name: 'playlist',
	description: 'Permet de jouer une playliste.',
	options: [{
		name: "titre", // no uppercase as well
		description: "Titre de la playlist sur YouTube",
		type: 3,
		required: true
	}]
},
{
	name: 'skip',
	description: 'Passe à la musique suivante'
},
{
	name: 'stop',
	description: 'Stoppe la musique'
},
{
	name: 'remove-loop',
	description: 'Supprimer la boucle'
},
{
	name: 'toggle-loop',
	description: 'Activer la boucle'
},
{
	name: 'toggle-queue-loop',
	description: 'Activer la boucle de la liste'
},
{
	name: 'set-volume',
	description: 'Permet de régler le volume.',
	options: [{
		name: "volume", // no uppercase as well
		description: "Volume en %.",
		type: 4,
		required: true
	}]
}];

////////////////////////////////////////////////////////////////
// INITIALISATION DES COMMANDES ET CONNEXION À LA BASE DE DONNÉES
////////////////////////////////////////////////////////////////
const rest = new REST({ version: '9' }).setToken(config.get("DISCORD_BOT_TOKEN"));

(async () => {
	console.log('['+'INFO'.yellow+'] Connexion à la base de donnée...'.brightWhite);
	try {
		await sequelize.authenticate();
		console.log('['+'SUCCES'.brightGreen+'] Connexion à la base de donnée réussie.'.brightWhite);
		await initialiseDatabaseTables(); // On va initialiser les tables de la base de donnée
		
		try {
			console.log('['+'INFO'.yellow+'] Actualisation des commandes...'.brightWhite);
			//console.log(JSON.stringify(commands));
			await rest.put(
				Routes.applicationGuildCommands(config.get("CLIENT_ID"), config.get("GUILD_ID")),
				{ body: commands },
			);
	
			console.log('['+'SUCCES'.brightGreen+'] Toutes les commandes ont été actualisées.');
		} catch (error) {
			console.error('['+'ERREUR'.brightRed+'] Erreur lors de l\'actualisation des commandes:'.brightWhite+error);
		}
	} catch (error) {
		console.log('['+'ERREUR'.brightRed+'] Erreur lors de la connexion à la base de donnée:'.brightWhite);
		console.log('['+'DEBUG'.yellow+'] '.brightWhite+config.get("BDD_USER")+":"+config.get("BDD_PASSWORD")+"@"+config.get("BDD_HOST")+" db:"+config.get("BDD_NAME")+'\n');
		console.error(error);
	}
	
})();

async function initialiseDatabaseTables(){
	console.log('['+'INFO'.yellow+'] Initialisation des tables...'.brightWhite);
	try{
		await botSettings.sync();
		await memberSettings.sync();

		// Basiquement on regarde si l'entrée existe, puis on agit en conséquence
		let token = await botSettings.findOne({where: {name: "token" }});
		if(token == null){
			// INSERT si elle n'existe pas
			console.log('['+'INSERT'.brightMagenta+'] Insertion de token'.brightWhite);
			let token = botSettings.create({
				name: "token",
				value: config.get("DISCORD_BOT_TOKEN")
			});
		}else{
			// UPDATE si différente
			if(token.value != config.get("DISCORD_BOT_TOKEN")){
				token.update({value: config.get("DISCORD_BOT_TOKEN")})
				.then(updatedRecord => {
					console.log('['+'UPDATE'.brightMagenta+'] Mise à jour du token dans la base de donnée'.brightWhite);
				}).catch(err => {
					console.log('['+'ERREUR'.brightRed+'] Erreur lors de la màj de token dans la base de donnée: '.brightWhite+'\n');
					throw new Error(err);
				});
			}
		}

		// Et c'est pareil à chaque fois
		let clientId = await botSettings.findOne({where: {name: "clientId" }});
		if(clientId == null){
			console.log('['+'INSERT'.brightMagenta+'] Insertion de clientId'.brightWhite);
			let clientId = botSettings.create({
				name: "clientId",
				value: config.get("CLIENT_ID")
			});
		}else{
			if(clientId.value != config.get("CLIENT_ID")){
				clientId.update({value: config.get("CLIENT_ID")})
				.then(updatedRecord => {
					console.log('['+'UPDATE'.brightMagenta+'] Mise à jour du clientId dans la base de donnée'.brightWhite);
				}).catch(err => {
					console.log('['+'ERREUR'.brightRed+'] Erreur lors de la màj de clientId dans la base de donnée: '.brightWhite+'\n');
					throw new Error(err);
				});
			}
		}

		let guildId = await botSettings.findOne({where: {name: "guildId" }});
		if(guildId == null){
			console.log('['+'INSERT'.brightMagenta+'] Insertion de guildId'.brightWhite);
			let guildId = botSettings.create({
				name: "guildId",
				value: config.get("GUILD_ID")
			});
		}else{
			if(guildId.value != config.get("GUILD_ID")){
				guildId.update({value: config.get("GUILD_ID")})
				.then(updatedRecord => {
					console.log('['+'UPDATE'.brightMagenta+'] Mise à jour du guildId dans la base de donnée'.brightWhite);
				}).catch(err => {
					console.log('['+'ERREUR'.brightRed+'] Erreur lors de la màj de guildId dans la base de donnée: '.brightWhite+'\n');
					throw new Error(err);
				});
			}
		}

		let commandPrefix = await botSettings.findOne({where: {name: "commandPrefix" }});
		if(commandPrefix == null){
			console.log('['+'INSERT'.brightMagenta+'] Insertion de commandPrefix'.brightWhite);
			let clientId = botSettings.create({
				name: "commandPrefix",
				value: "!"
			});
		}

		console.log('['+'SUCCES'.brightGreen+'] Tables initialisées avec succès.'.brightWhite);
	} catch (error) {
		console.error('['+'ERREUR'.brightRed+'] Erreur lors de l\'initialisation des tables:'.brightWhite+'\n', error);
	}
	
}

////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// CONSOLE
////////////////////////////////////////////////////////////////

// Console Input/Output
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ce code est a améliorer, je l'ai vulgairement recopié d'un ancien bot (lui même pas très bien conçu)
var recursiveAsyncReadLine = function () {
  rl.question('Commande: ', function (answer) {
    //if (answer == 'exit')
    //  return rl.close();
    const args = answer.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);
	const command = args.shift().toLowerCase();

	switch(command){
		case "say":
			if(!args[0] || !args[1])
				console.log('\n'+'['+'ERREUR'.brightRed+"] Tu n'as pas mis d'arguments :p"+'\n'+'['+'INFO'.yellow+"] Usage: say <Numéro du canal> <\"Texte\">");
			else {
				var message = args[1].substring(1, args[1].length-1);
				client.channels.cache.get(args[0]).send(message);
				console.log('\n'+'['+'SUCCES'.brightGreen+'] Le message a été envoyé dans le canal n°'+args[0]);
			}
			break;

		default:
			console.log('\n'+"Commande inconnue. :p");
			break;
	}
	
    recursiveAsyncReadLine(); //Calling this function again to ask new question
  });
};

recursiveAsyncReadLine(); //we have to actually start our recursion somehow

////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// BOT DISCORD
////////////////////////////////////////////////////////////////
// require the needed discord.js classes
const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');

// create a new Discord client
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES", "GUILD_VOICE_STATES"] });

// Tests
const settings = {
    prefix: '!',
    token: 'YourBotTokenHere'
};

////////////////////////////////////////////////////////////////
// Partie musique

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false, // This options are optional.
});
// You can define the Player as *client.player* to easly access it.
client.player = player;

// Init the event listener only once (at the top of your code).
client.player
    // Emitted when channel was empty.
    .on('channelEmpty',  (queue) =>
        console.log(`Everyone left the Voice Channel, queue ended.`))
    // Emitted when a song was added to the queue.
    .on('songAdd',  (queue, song) =>
        console.log(`Song ${song} was added to the queue.`))
    // Emitted when a playlist was added to the queue.
    .on('playlistAdd',  (queue, playlist) =>
        console.log(`Playlist ${playlist} with ${playlist.songs.length} was added to the queue.`))
    // Emitted when there was no more music to play.
    .on('queueEnd',  (queue) =>
        console.log(`The queue has ended.`))
    // Emitted when a song changed.
    .on('songChanged', (queue, newSong, oldSong) =>
        console.log(`${newSong} is now playing.`))
    // Emitted when a first song in the queue started playing.
    .on('songFirst',  (queue, song) =>
        console.log(`Started playing ${song}.`))
    // Emitted when someone disconnected the bot from the channel.
    .on('clientDisconnect', (queue) =>
        console.log(`I was kicked from the Voice Channel, queue ended.`))
    // Emitted when deafenOnJoin is true and the bot was undeafened
    .on('clientUndeafen', (queue) =>
        console.log(`I got undefeanded.`))
    // Emitted when there was an error in runtime
    .on('error', (error, queue) => {
        console.log(`Error: ${error} in ${queue.guild.name}`);
    });

////////////////////////////////////////////////////////////////

client.on("ready", async function () {
    console.log('\n'+`
         ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,    ,,,,,,,,,,
    ▄▄█████████████████████████████████▌    ██████████
  ▄███████████████████████████████████▀     ██████████
 ██████████████████████████████████▀▀       ██████████
▐███▀▀ -                                    ██████████
██▀ ,▄████▌                                 ██████████
╙  ████████▄,,,,,,,,,,,,,,,,,,,,            ██████████
  ▐████████████████████████████████▄,       ██████████
   ███████████████████████████████████,     ██████████
    '▀▀████████████████████████████████▄     █████████
                             ▀██████████     '████████
                              ██████████'   █▄  "▀▀▀▀▀
╒▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄███████████    █████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
 ▀█████████████████████████████████████     ███████████████████████████████████▀
   ▀█████████████████████████████████▀      ██████████████████████████████████'
      ▀▀▀██████████████████████▀▀▀          ▀████████████████████████████▀▀▀
      `);
  console.log("");
  console.log("Bot démarré".brightGreen);
});

// Commandes
client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()){
		console.log('['+'COMMANDE'.brightMagenta+'] '.brightWhite+interaction.user.username.brightBlue+' a lancé la commande '.brightWhite+interaction.commandName.yellow);
		if (interaction.commandName === 'ping') {
			await interaction.reply('Pong!');
		}

		// Commandes pour le bot de musique
		let guildQueue = client.player.getQueue(interaction.guild.id);

		if (interaction.commandName === 'play') {
			await interaction.reply('Attend j\'appelle Jacqueline de la compta');
			let queue = client.player.createQueue(interaction.guild.id);
			await queue.join(interaction.member.voice.channel);
			let song = await queue.play( interaction.options.getString('titre') ).catch(async _ => {
				if(!guildQueue){
					queue.stop();
				}
			});
			await interaction.editReply("song: "+guildQueue.nowPlaying);
		}

		if (interaction.commandName === 'playlist') {
			let queue = client.player.createQueue(interaction.guild.id);
			await queue.join(interaction.member.voice.channel);
			let song = await queue.playlist( interaction.options.getString('titre') ).catch(_ => {
				if(!guildQueue)
					queue.stop();
			});
		}

		if (interaction.commandName === 'skip') {
			guildQueue.skip();
		}

		if (interaction.commandName === 'stop') {
			guildQueue.stop();
		}

		if (interaction.commandName === 'removeLoop') {
			guildQueue.setRepeatMode(RepeatMode.DISABLED); // or 0 instead of RepeatMode.DISABLED
		}

		if (interaction.commandName === 'toggleLoop') {
			guildQueue.setRepeatMode(RepeatMode.SONG); // or 1 instead of RepeatMode.SONG
		}

		if (interaction.commandName === 'toggleQueueLoop') {
			guildQueue.setRepeatMode(RepeatMode.QUEUE); // or 2 instead of RepeatMode.QUEUE
		}

		if (interaction.commandName === 'setVolume') {
			guildQueue.setVolume(parseInt(args[0]));
		}

		if (interaction.commandName === 'seek') {
			guildQueue.seek(parseInt(args[0]) * 1000);
		}

		if (interaction.commandName === 'clearQueue') {
			guildQueue.clearQueue();
		}

		if (interaction.commandName === 'shuffle') {
			guildQueue.shuffle();
		}

		if (interaction.commandName === 'getQueue') {
			console.log(guildQueue);
		}

		if (interaction.commandName === 'getVolume') {
			console.log(guildQueue.volume)
		}

		if (interaction.commandName === 'nowPlaying') {
			console.log(`Now playing: ${guildQueue.nowPlaying}`);
		}

		if (interaction.commandName === 'pause') {
			guildQueue.setPaused(true);
		}

		if (interaction.commandName === 'resume') {
			guildQueue.setPaused(false);
		}

		if (interaction.commandName === 'remove') {
			guildQueue.remove(parseInt(args[0]));
		}

		if (interaction.commandName === 'createProgressBar') {
			const ProgressBar = guildQueue.createProgressBar();
			
			// [======>              ][00:35/2:20]
			console.log(ProgressBar.prettier);
		}
	}	
});

// Tests
const { RepeatMode } = require('discord-music-player');

client.on('messageCreate', async (message) => {
	
    
})



// login to Discord with your app's token
client.login(config.get("DISCORD_BOT_TOKEN"));