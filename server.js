const express = require('express');
const cors = require('cors');
const path = require('path'); // Necessário apenas para o path.join
const { Produto, Contato, sequelize } = require('./database'); // Importa os modelos e a instância Sequelize

// --- CLOUDINARY E MULTER CONFIGURAÇÃO ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuração do Cloudinary (Usa variáveis de ambiente do Render)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do Multer para usar o Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lojacastro', // Pasta no Cloudinary
        format: async (req, file) => 'jpg',
        public_id: (req, file) => Date.now() + '-' + file.originalname,
    },
});

const upload = multer({ storage: storage });

// --- CONFIGURAÇÃO DO SERVIDOR ---
const app = express();
// Usa a porta do Render ou 3000 localmente
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permite requisições do seu Frontend
app.use(express.json()); // Processa JSON no corpo da requisição
app.use(express.urlencoded({ extended: true })); // Processa dados de formulário

// --- ARQUIVOS ESTÁTICOS DO FRONTEND ---
// Esta linha é crítica para servir o seu Frontend (index.html, produtos.html, etc.)
// Assumindo que a pasta Frontend está na raiz do seu servidor de Backend (NÃO RECOMENDADO, MAS FUNCIONA)
// Se você está servindo o Frontend de outro lugar, você pode remover ou comentar esta linha.
const frontendPath = path.join(__dirname, 'public'); 
app.use(express.static(frontendPath));


// --- ROTAS DA API ---

// 1. Rota GET para Produtos (Listagem)
app.get('/api/produtos', async (req, res) => {
    try {
        const produtos = await Produto.findAll(); // Busca todos os produtos no PostgreSQL
        res.json(produtos);
    } catch (error) {
        console.error("Erro ao listar produtos:", error);
        res.status(500).send({ message: "Erro ao carregar os produtos." });
    }
});

// 2. Rota POST para Produtos (Cadastro com Cloudinary/Sequelize)
app.post('/api/produtos', upload.single('imagem'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "É necessário enviar um arquivo de imagem." });
        }

        const { nome, preco, descricao } = req.body;
        const imagemUrl = req.file.path; // URL do Cloudinary

        // Salva os dados no PostgreSQL
        const novoProduto = await Produto.create({
            nome,
            preco: parseFloat(preco),
            descricao,
            imagem: imagemUrl // Salva a URL completa
        });

        res.status(201).json(novoProduto);
    } catch (error) {
        console.error("Erro ao cadastrar produto (Cloudinary/Sequelize):", error);
        // Retorna o erro de salvamento
        res.status(500).send({ message: "Erro ao salvar o produto." });
    }
});

// 3. Rota POST para Contatos (Cadastro com Sequelize)
app.post('/api/contatos', async (req, res) => {
    try {
        const { nome, email, telefone, mensagem } = req.body;
        
        // Salva os dados no PostgreSQL
        const novoContato = await Contato.create({
            nome,
            email,
            telefone,
            mensagem
        });

        // Retorna a mensagem de sucesso
        res.status(201).json({ message: 'Mensagem enviada com sucesso!', contato: novoContato });

    } catch (error) {
        console.error("Erro ao salvar contato:", error);
        // Retorna o erro de conexão/salvamento
        res.status(500).send({ message: "Houve um erro de conexão. Por favor, verifique se o servidor está ativo." });
    }
});

// --- INICIA O SERVIDOR ---
// A sincronização do banco de dados (sequelize.sync) já está no database.js
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
