const axios = require('axios');
const sharp = require('sharp');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const puzzleData = require('../data/wca_event.json');
const logger = require('./logger');

require('dotenv').config();

const STORAGE_CHANNEL_ID = process.env.STORAGE_CHANNEL_ID;

const iconCache = new Map();

const eventChoices = Object.entries(puzzleData).map(([key, info]) => ({
  name: info.name || key,
  value: key
}));

async function uploadToStorageChannel(client, targetChannelId, txtContent, fileName) {
  try {
    const channel = await client.channels.fetch(targetChannelId);
    if (!channel) return null;

    const buffer = Buffer.from(txtContent, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: fileName });

    const sentMessage = await channel.send({
      content: `📁 스크램블 파일 : \`${fileName}\``,
      files: [attachment]
    });

    return sentMessage.attachments.first().url;
  } catch (e) {
    logger.error(`파일 전송 실패: ${e.message}`);
    return null;
  }
}

async function getEventIconURL(eventInfo) {
  const iconName = eventInfo?.event_id || '333';

  if (iconCache.has(iconName)) {
    return iconCache.get(iconName);
  }

  const svgUrl = `https://raw.githubusercontent.com/cubing/icons/refs/heads/main/src/svg/${iconName === 'fto' ? "unofficial" : "event"}/${iconName}.svg`;

  try {
    const response = await axios.get(svgUrl, { responseType: 'arraybuffer' });
    if (response.status !== 200) return null;

    const pngBuffer = await sharp(response.data).png().toBuffer();
    const fileName = `event-${iconName}.png`;
    const attachment = new AttachmentBuilder(pngBuffer, { name: fileName });

    const result = { attachment, fileName };
    iconCache.set(iconName, result);

    return result;
  } catch (e) {
    logger.error(`아이콘 로드 실패 (종목: ${iconName}): ${e.message}`);
    return null;
  }
}

async function generateScrambleText(eventKey) {
  const { randomScrambleForEvent } = await import('cubing/scramble');

  const cubingEventId = puzzleData[eventKey]?.event_id || '333';

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

function formatForTxt(scrambleStr, isMegaminx) {
  if (isMegaminx) {
    let rawStr = scrambleStr.replace(/\n/g, ' ');

    return rawStr
      .replace(/U'\s*/g, "U'\\n")
      .replace(/(^|\s)U\s+/g, "$1U \\n")
      .trim();
  }
  return scrambleStr;
}

async function processScramble(interaction, event, isSet = false, customCount = null) {
  await interaction.deferReply();

  try {
    const eventInfo = puzzleData[event];

    if (!eventInfo || !eventInfo.event_id) {
      return await interaction.editReply("⚠️ 지원하지 않는 종목이거나 데이터 매핑에 실패했습니다.");
    }

    const eventName = eventInfo.name || "Unknown Event";
    const isMbld = (event === "3x3 mbld");
    const isMinx = (eventInfo.event_id === 'minx');

    if (customCount !== null && !isMbld) {
      return await interaction.editReply("⚠️ `count` 옵션은 멀티블라인드(`3x3 mbld`) 종목에서만 사용할 수 있습니다.");
    }

    const embed = new EmbedBuilder().setColor('Green');
    const files = [];

    // 종목 아이콘 설정
    const iconURL = await getEventIconURL(eventInfo);
    if (iconURL) {
      files.push(iconURL.attachment);
      embed.setAuthor({ name: eventName, iconURL: `attachment://${iconURL.fileName}` });
    } else {
      embed.setAuthor({ name: eventName });
    }

    let txtContent = "";
    let scrambleTextForDisplay = "";

    if (!isSet) {
      if (isMbld) {
        const targetCount = customCount !== null ? customCount : 5;
        if (targetCount < 3) return await interaction.editReply("⚠️ 멀티블라인드 큐브 개수는 최소 3개 이상이어야 합니다.");

        const rawScrambles = await Promise.all(
          Array.from({ length: targetCount }, () => generateScrambleText(event))
        );

        scrambleTextForDisplay = rawScrambles.map((s, i) => `${i + 1}. ${s}`).join("\n\n");
        txtContent = " " + rawScrambles.map((s, i) => `${i + 1}. ${formatForTxt(s, isMinx)}`).join("\\n");
      } else {
        const singleScramble = await generateScrambleText(event);
        scrambleTextForDisplay = singleScramble;
        txtContent = formatForTxt(singleScramble, isMinx);
      }

      embed.setTitle(`Scramble`);
    } else {
      const defaultSetCount = eventInfo.count || 5;
      let setCount = customCount !== null ? customCount : defaultSetCount;

      if (isMbld && setCount < 3) {
        return await interaction.editReply("⚠️ 멀티블라인드 세트 개수는 최소 3개 이상이어야 합니다.");
      }

      embed.setTitle(`Scramble Set`);

      const setPromises = Array.from({ length: setCount }, async (_, i) => {
        let displayScrambleText = "";
        let txtScrambleText = "";

        if (isMbld) {
          const sessionScrambles = await Promise.all(
            Array.from({ length: 5 }, () => generateScrambleText(event))
          );
          displayScrambleText = sessionScrambles.map((s, idx) => `${idx + 1}. ${s}`).join("\n");
          txtScrambleText = " " + sessionScrambles.map((s, idx) => `${idx + 1}. ${formatForTxt(s, isMinx)}`).join("\\n");
        } else {
          const singleScramble = await generateScrambleText(event);
          displayScrambleText = singleScramble;
          txtScrambleText = formatForTxt(singleScramble, isMinx);
        }

        return { setIndex: i + 1, displayScrambleText, txtScrambleText };
      });

      const results = await Promise.all(setPromises);
      const txtLines = [];

      for (const { setIndex, displayScrambleText, txtScrambleText } of results) {
        embed.addFields({ name: `Set ${setIndex}`, value: `\`\`\`\n${displayScrambleText}\n\`\`\``, inline: false });
        txtLines.push(`${txtScrambleText}`);
      }

      txtContent = txtLines.join("\n\n");
    }

    const now = new Date();
    const date = `${String(now.getUTCFullYear()).slice(-2)}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}_${String(now.getUTCHours()).padStart(2, '0')}-${String(now.getUTCMinutes()).padStart(2, '0')}-${String(now.getUTCSeconds()).padStart(2, '0')}`
    const userName = interaction.user.username.replace(/[\/\\?%*:|"<>\s]/g, '_')

    const txtFileName = `${date}_${userName}_${eventInfo.event_id}_scramble.txt`;

    const fileUrl = await uploadToStorageChannel(interaction.client, STORAGE_CHANNEL_ID, txtContent, txtFileName);

    let downloadPrefix = "";
    if (fileUrl) {
      downloadPrefix = `📥 [스크램블 txt 파일 다운로드](${fileUrl})\n`;
    }

    if (!isSet) {
      embed.setDescription(`${downloadPrefix}\`\`\`\n${scrambleTextForDisplay}\n\`\`\``);
    } else {
      if (downloadPrefix) embed.setDescription(downloadPrefix);
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