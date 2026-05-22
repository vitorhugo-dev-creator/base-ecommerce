const path = require('path');
const sharp = require('sharp');
const { getDb } = require('./db');

function getSettings() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM store_settings').all();
  return rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
}

function generateOrderCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return 'PED-' + ts + rand;
}

async function saveImage(buffer, filename, folder = 'products') {
  const outputPath = path.join(__dirname, '..', 'public', folder, filename);
  await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
  return `/${folder}/${filename}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function createPixPayload(pixKey, amount, merchantName = 'Loja', city = 'Cidade') {
  const amountStr = amount.toFixed(2);
  const nameClean = merchantName.substring(0, 25).toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const cityClean = city.substring(0, 15).toUpperCase().replace(/[^A-Z\s]/g, '');

  const gui = 'BR.GOV.BCB.PIX';
  const keyPart = `01${String(pixKey.length).padStart(2, '0')}${pixKey}`;
  const merchantAccount = `26${String(gui.length + keyPart.length).padStart(2, '0')}0014${gui}${keyPart}`;

  let payload = '000201';
  payload += merchantAccount;
  payload += '52040000';
  payload += '5303986';
  payload += `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;
  payload += '5802BR';
  payload += `59${String(nameClean.length).padStart(2, '0')}${nameClean}`;
  payload += `60${String(cityClean.length).padStart(2, '0')}${cityClean}`;
  payload += '62070503***';
  payload += '6304';

  payload += crc16(payload);
  return payload;
}

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

module.exports = { getSettings, generateOrderCode, saveImage, escapeHtml, createPixPayload };
