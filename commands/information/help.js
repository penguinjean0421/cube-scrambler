
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const botData = require('../../data/bot_data.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('봇의 사용 방법과 명령어 목록을 확인합니다.'),

	async execute(interaction) {
		const data = botData.credit;

		const embed = new EmbedBuilder()
			.setTitle(`${data.bot_name} 도움말`)
			.setDescription('WCA 규격 스크램블을 지원하는 디스코드 기반 퍼즐 스크램블러 봇입니다.')
			.setColor('Blue')
			.addFields(
				{
					name: '주요 기능',
					value: '• WCA 공인 규격 스크램블 제공\n• 3x3, 2x2, 피라밍크스 등 WCA 공인 종목 퍼즐 지원',
					inline: false
				},
				{
					name: '명령어',
					value: '`/help` : 도움말 확인\n`/puzzle-list` : 지원 퍼즐 목록\n`/scramble` : 단일 스크램블\n`/scramble-set` : 스크램블 세트',
					inline: false
				}
			)
			.setFooter({ text: `${data.bot_name} | Node.js (discord.js)` });

		await interaction.reply({ embeds: [embed] });
	}
};