const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const puzzleData = require('../../data/wca_event.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('puzzle-list')
    .setDescription('지원하는 WCA 공인 퍼즐 목록을 확인합니다.'),

  async execute(interaction) {
    if (!puzzleData || Object.keys(puzzleData).length === 0) {
      return interaction.reply({ content: '퍼즐 데이터를 불러오는 중 오류가 발생했습니다.', ephemeral: true });
    }

    const puzzleNames = Object.values(puzzleData).map(info => info.name);

    const embed = new EmbedBuilder()
      .setTitle('지원하는 퍼즐 목록')
      .setDescription('현재 지원하고 있는 퍼즐 리스트 입니다.')
      .setColor('Green')
      .addFields(
        { name: 'WCA 공인종목', value: puzzleNames.join(', ') },
        // { name: '비공인종목', value: puzzleNames.join(', ') }
      );

    await interaction.reply({ embeds: [embed] });
  }
};