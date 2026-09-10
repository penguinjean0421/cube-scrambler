const fs = require('node:fs');
const path = require('node:path');

const logger = require('./logger');
const usageDir = path.join(__dirname, 'logs', 'usage');
const outputFile = path.join(__dirname, 'stats.csv');

let csvContent = '\uFEFF';
csvContent += 'Time,UserName,UserID,Command,Options,ServerName\n';

if (!fs.existsSync(usageDir)) {
  console.log('❌ 통계 폴더가 존재하지 않습니다.');
  process.exit(1);
}

const files = fs.readdirSync(usageDir).filter(file => file.endsWith('.log'));

if (files.length === 0) {
  console.log('⚠️ 추출할 로그 파일이 없습니다.');
  process.exit(0);
}

for (const file of files) {
  const filePath = path.join(usageDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      const data = JSON.parse(line);
      if (data.message === 'command_usage') {
        csvContent += `"${data.timestamp}","${data.username}","${data.userId}","${data.command}","${data.options}","${data.server}"\n`;
      }
    } catch (e) {
      logger.error(`[${file}] ${i + 1}번째 줄]JSON 파싱 실패: ${e.message}`, { line });
    }
  }
}

fs.writeFileSync(outputFile, csvContent, 'utf-8');
console.log(`✅ 통계 추출 완료: ${outputFile}`);