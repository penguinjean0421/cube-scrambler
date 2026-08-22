const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const botData = require('../../data/bot_data.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credit')
    .setDescription('봇의 제작자를 소개합니다.'),

  async execute(interaction) {
    const data = botData.credit;

    const embed = new EmbedBuilder()
      .setTitle(`Thanks for using ${data.bot_name}`)
      .setDescription(`${data.bot_name}를 함께 만들어주신 분들입니다.`)
      .setColor(0x0f4c81)
      .addFields(
        { name: 'Version', value: `\`${data.version}\` (Production)`, inline: true },
        { name: 'Hosting', value: `Hosted by [${data.hosting_name}](${data.hosting_url})`, inline: true },
        { name: 'Support Server', value: `[공식 서포트 서버 바로가기](${data.support_server})`, inline: false },
        { name: 'Contact', value: `[개발자에게 연락하기](mailto:${data.contact})`, inline: false },
        { name: 'Developer', value: `[${data.developer_name}](https://www.worldcubeassociation.org/persons/${data.developer_wca})([@${data.developer_github}](https://github.com/@${data.developer_github}))`, inline: false },
        { name: 'Tech Stack', value: `discord.js, ${data.tech_stack}`, inline: false },
        { name: 'Source Code', value: `[GitHub Repository](https://github.com/${data.developer_github}/${data.repository})`, inline: false },
        { name: 'License', value: `[라이선스 확인하기](${data.license})`, inline: false },
      );

    await interaction.reply({ embeds: [embed] });
  }
};