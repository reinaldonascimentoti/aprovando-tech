const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Caminho absoluto para o PDF de teste dentro da pasta test-pdfs
const filePath = path.resolve(__dirname, 'test-pdfs', 'test.pdf');

// Verifica se o arquivo existe
if (!fs.existsSync(filePath)) {
  console.error('❌ PDF não encontrado:', filePath);
  process.exit(1);
}

// Monta o multipart/form-data
const form = new FormData();
form.append('file', fs.createReadStream(filePath));

const uploadUrl = 'http://localhost:3000/api/pdf/upload-lesson';

fetch(uploadUrl, {
  method: 'POST',
  body: form,
  headers: form.getHeaders(),
})
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    return res.json();
  })
  .then(json => {
    console.log('✅ Resposta da API:');
    console.log(JSON.stringify(json, null, 2));
  })
  .catch(err => {
    console.error('❌ Erro ao enviar PDF:', err.message);
  });
