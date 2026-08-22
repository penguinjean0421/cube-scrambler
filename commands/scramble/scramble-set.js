const { SlashCommandBuilder } = require('discord.js');
const { processScramble, handleAutocomplete } = require('../../utils/scrambleUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scramble-set')
    .setDescription('WCA 규격에 따른 퍼즐 종목별 스크램블 세트를 생성합니다.')
    .addStringOption(option =>
      option.setName('event')
        .setDescription('스크램블 세트를 생성할 종목을 선택하세요.')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('멀티블라인드 종목에서만 사용 가능합니다. (최소 3개)')
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    await handleAutocomplete(interaction);
  },

  async execute(interaction) {
    const event = interaction.options.getString('event');
    const count = interaction.options.getInteger('count');
    await processScramble(interaction, event, true, count);
  }
};