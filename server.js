const express = require('express');
const formidable = require('formidable'); // Substituí Multer por Formidabl
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware para processar dados de formulário e arquivos estáticos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Servir arquivos estáticos da pasta 'public'

// Definir o caminho base para armazenar os arquivos
const baseDirectory = process.env.BASE_PATH || 'C:/serv';

// Verificar se o diretório base existe
if (!fs.existsSync(baseDirectory)) {
  console.error(`Erro: O diretório base ${baseDirectory} não existe.`);
  process.exit(1); // Sair se o diretório não existir
}

// Rota para servir a página inicial (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para submissão de formulários e geração de PDF
app.post('/prestacao', (req, res) => {
  console.log("Submissão recebida para geração de prestação de contas...");

  const form = new formidable.IncomingForm();
  form.uploadDir = 'uploads'; // Definir a pasta de uploads
  form.keepExtensions = true; // Manter a extensão dos arquivos
  form.multiples = true; // Permitir múltiplos arquivos

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Erro ao processar os arquivos:", err);
      return res.status(500).json({ message: 'Erro ao processar arquivos.' });
    }

    const { servidor, periodo, justificativa, signature } = fields;
    const comprovantes = files.comprovantes || [];

    // Validar dados do formulário
    if (!servidor || !periodo || !justificativa || comprovantes.length === 0) {
      console.error("Erro: Dados incompletos ou arquivos ausentes.");
      return res.status(400).json({ message: 'Dados incompletos ou arquivos ausentes.' });
    }

    // Caminho da pasta do servidor
    const serverFolder = path.join(baseDirectory, servidor);

    // Criar a pasta do servidor se não existir
    if (!fs.existsSync(serverFolder)) {
      try {
        fs.mkdirSync(serverFolder, { recursive: true });
        console.log(`Pasta criada: ${serverFolder}`);
      } catch (err) {
        console.error(`Erro ao criar a pasta: ${err}`);
        return res.status(500).json({ message: 'Erro ao criar pasta do servidor.' });
      }
    } else {
      console.log(`Pasta já existente: ${serverFolder}`);
    }

    // Caminho para salvar o PDF
    const pdfPath = path.join(serverFolder, `prestacao_${Date.now()}.pdf`);

    // Criar o documento PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);

    console.log("Gerando o PDF...");

    // Escrever o conteúdo no PDF
    doc.pipe(stream);
    doc.fontSize(16).text('Prestação de Contas de Diárias', { align: 'center' });
    doc.text(`Nome do Servidor: ${servidor}`, { align: 'left' });
    doc.text(`Período da Viagem: ${periodo}`, { align: 'left' });
    doc.text(`Justificativa: ${justificativa}`, { align: 'left' });
    doc.text('\n\nComprovantes anexados:');

    // Processar os arquivos anexados
    comprovantes.forEach((file, index) => {
      const originalFilename = file.originalFilename;
      const newFilePath = path.join(serverFolder, originalFilename);

      // Mover os arquivos enviados para a pasta do servidor
      try {
        fs.renameSync(file.filepath, newFilePath);
        doc.text(`${index + 1}. ${originalFilename}`);

        // Se o arquivo for uma imagem, adicionar ao PDF
        if (file.mimetype.startsWith('image/')) {
          doc.image(newFilePath, {
            fit: [500, 400],
            align: 'center',
            valign: 'center',
          });
        }
      } catch (err) {
        console.error(`Erro ao mover o arquivo: ${err}`);
        return res.status(500).json({ message: 'Erro ao mover os arquivos enviados.' });
      }
    });

    // Adicionar a assinatura ao PDF
    if (signature) {
      doc.text("Assinatura:", 10, 150);
      doc.image(signature, 10, 160, { fit: [100, 50] });
    }

    doc.end();

    // Finalizar a geração do PDF e enviar resposta ao cliente
    stream.on('finish', () => {
      console.log("PDF gerado com sucesso.");
      res.status(200).json({ 
        message: 'Prestação enviada com sucesso!', 
        ticket: `Prestacao-${Date.now()}` 
      });
    });

    stream.on('error', (err) => {
      console.error(`Erro ao gerar o PDF: ${err}`);
      res.status(500).json({ message: 'Erro ao gerar o PDF.' });
    });
  });
});

// Iniciar o servidor na porta configurada
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
