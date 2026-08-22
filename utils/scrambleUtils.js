const axios = require('axios');
const sharp = require('sharp');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const puzzlesData = require('../data/wca_event.json');
const logger = require('./logger');

const eventChoices = Object.entries(puzzlesData).map(([key, info]) => ({
  name: info.name || key,
  value: key
}));

async function getEventIconURL(eventInfo) {
  const iconName = eventInfo?.event_id || '333';
  const svgUrl = `https://raw.githubusercontent.com/cubing/icons/refs/heads/main/src/svg/${iconName === 'fto' ? "unofficial" : "event"}/${iconName}.svg`;

  try {
    const response = await axios.get(svgUrl, { responseType: 'arraybuffer' });
    if (response.status !== 200) return null;

    const pngBuffer = await sharp(response.data).png().toBuffer();
    const fileName = `event-${iconName}.png`;
    const attachment = new AttachmentBuilder(pngBuffer, { name: fileName });

    return { attachment, fileName };
  } catch (e) {
    logger.error(`아이콘 로드 실패 (종목: ${iconName}): ${e.message}`);
    return null;
  }
}

async function generateScrambleText(eventKey) {
  const { randomScrambleForEvent } = await import('cubing/scramble');

  const cubingEventId = puzzlesData[eventKey]?.event_id || '333';

  try {
    const scrambleObj = await randomScrambleForEvent(cubingEventId);
    let scrambleStr = scrambleObj.toString();

    if (cubingEventId === 'minx') {
      scrambleStr = scrambleStr.replace(/(U'?)\s/g, "$1\n").trim();
    }

    return scrambleStr;
  } catch (e) {
    logger.error(`스크램블 텍스트 생성 실패 (이벤트: ${eventKey}): ${e.message}`, e);
    throw new Error('스크램블 생성에 실패했습니다.');
  }
}

async function processScramble(interaction, event, isSet = false, customCount = null) {
  await interaction.deferReply();

  try {
    const eventInfo = puzzlesData[event];

    if (!eventInfo || !eventInfo.event_id) {
      return await interaction.editReply("⚠️ 지원하지 않는 종목이거나 데이터 매핑에 실패했습니다.");
    }

    const eventName = eventInfo.name || "Unknown Event";
    const isMbld = (event === "3x3 mbld");

    if (customCount !== null && !isMbld) {
      return await interaction.editReply("⚠️ `count` 옵션은 멀티블라인드(`3x3 mbld`) 종목에서만 사용할 수 있습니다.");
    }

    const embed = new EmbedBuilder().setColor('Green');

    // 아이콘 로드 처리
    const iconURL = await getEventIconURL(eventInfo);
    const files = [];

    if (iconURL) {
      files.push(iconURL.attachment);
      embed.setAuthor({ name: eventName, iconURL: `attachment://${iconURL.fileName}` });
    } else {
      embed.setAuthor({ name: eventName });
    }

    if (!isSet) {
      let scrambleText = "";
      if (isMbld) {
        const targetCount = customCount !== null ? customCount : 5;
        if (targetCount < 3) return await interaction.editReply("⚠️ 멀티블라인드 큐브 개수는 최소 3개 이상이어야 합니다.");

        const scrambles = [];
        for (let i = 0; i < targetCount; i++) {
          scrambles.push(await generateScrambleText(event));
        }
        scrambleText = scrambles.map((s, i) => `${i + 1}. ${s}`).join("\n\n");
      } else {
        scrambleText = await generateScrambleText(event);
      }

      embed.setTitle(`${eventName} Scramble`);
      embed.setDescription(`\`\`\`\n${scrambleText}\n\`\`\``);
    }
    else {
      const defaultSetCount = eventInfo.count || 5;
      let setCount = customCount !== null ? customCount : defaultSetCount;

      if (isMbld && setCount < 3) {
        return await interaction.editReply("⚠️ 멀티블라인드 세트 개수는 최소 3개 이상이어야 합니다.");
      }

      embed.setTitle(`${eventName} Scramble Set`);

      for (let i = 0; i < setCount; i++) {
        let setScrambleText = "";
        if (isMbld) {
          const sessionScrambles = [];
          for (let j = 0; j < 5; j++) sessionScrambles.push(await generateScrambleText(event));
          setScrambleText = sessionScrambles.map((s, idx) => `${idx + 1}. ${s}`).join("\n");
        } else {
          setScrambleText = await generateScrambleText(event);
        }
        embed.addFields({ name: `Set ${i + 1}`, value: `\`\`\`\n${setScrambleText}\n\`\`\``, inline: false });
      }
    }

    embed.setFooter({ text: `요청자: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
    await interaction.editReply({ embeds: [embed], files: files });

  } catch (e) {
    logger.error(`스크램블 헬퍼 함수 실행 중 오류 (이벤트: ${event}): ${e.message}`, e);
    const errorEmbed = new EmbedBuilder()
      .setTitle("❌ 오류 발생")
      .setDescription(`스크램블을 생성하는 중 문제가 발생했습니다.\n\`${e.message}\``)
      .setColor('Red');
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

function handleAutocomplete(interaction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const filtered = eventChoices
    .filter(choice => choice.name.toLowerCase().includes(focusedValue))
    .slice(0, 25);
  return interaction.respond(filtered);
}

module.exports = { processScramble, handleAutocomplete };