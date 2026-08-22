const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
require('dotenv').config();
const logger = require('./utils/logger');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
});

client.commands = new Collection();
const commandsArr = [];

const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
	fs.mkdirSync(commandsPath);
	console.log("📂 'commands' 폴더가 없어 새로 생성했습니다.");
}

const commandFolders = fs.readdirSync(commandsPath);
for (const folder of commandFolders) {
	const folderPath = path.join(commandsPath, folder);

	if (fs.statSync(folderPath).isDirectory()) {
		const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const filePath = path.join(folderPath, file);
			try {
				const command = require(filePath);
				if ('data' in command && 'execute' in command) {
					client.commands.set(command.data.name, command);
					commandsArr.push(command.data.toJSON());
					console.log(`✅ ${file} 로드 성공`);
				} else {
					console.log(`⚠️ ${file} 파일에 'data' 또는 'execute' 속성이 없습니다.`);
				}
			} catch (error) {
				console.log(`❌ ${file} 로드 실패 -> ${error}`);
			}
		}
	}
}

client.once(Events.ClientReady, async readyClient => {
	console.log("-".repeat(30));
	console.log(`🟢 ${readyClient.user.tag}(ID: ${readyClient.user.id}) 온라인`);
	console.log("-".repeat(30));

	const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
	try {
		console.log(`⏳ 총 ${commandsArr.length}개의 슬래시 명령어 동기화를 시작합니다.`);
		const data = await rest.put(
			Routes.applicationCommands(readyClient.user.id),
			{ body: commandsArr },
		);
		console.log(`✅ sync 슬래시 명령어 동기화 완료: 총 ${data.length}개`);
	} catch (error) {
		console.error(`❌ 슬래시 명령어 동기화 실패 -> ${error}`);
	}
});


client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;
		try { await command.autocomplete(interaction); } catch (error) { logger.error(error); }
		return;
	}

	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`${interaction.commandName} 명령어를 찾을 수 없습니다.`);
		return;
	}

	try {
		await command.execute(interaction);

		const options = interaction.options.data.map(opt => `${opt.name}:${opt.value}`).join(', ');

		logger.info('command_usage', {
			username: interaction.user.tag,
			userId: interaction.user.id,
			command: interaction.commandName,
			options: options || 'None',
			server: interaction.guild?.name || 'DM'
		});

	} catch (error) {
		logger.error(`명령어 실행 중 오류 (${interaction.commandName}): ${error.message}`, error);
		const errorReply = { content: '명령어를 실행하는 중 오류가 발생했습니다!', ephemeral: true };
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(errorReply);
		} else {
			await interaction.reply(errorReply);
		}
	}
});

process.on('uncaughtException', (error) => {
	logger.error(`처리되지 않은 예외 발생: ${error.message}`, error);
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error(`처리되지 않은 Promise 거부: ${reason}`);
});

const token = process.env.BOT_TOKEN;

if (!token) {
	console.log("❌ 오류: BOT_TOKEN이 .env 파일에 설정되지 않았습니다.");
	process.exit(1);
}

client.login(token).catch(error => {
	if (error.code === 'TokenInvalid') {
		console.log("❌ 오류: 토큰이 유효하지 않습니다.");
	} else {
		console.log(`❌ 실행 중 오류 발생: ${error}`);
	}
});

process.on('SIGINT', () => {
	console.log('\n종료 신호를 감지하여 봇을 종료합니다.');
	client.destroy();
	process.exit(0);
});