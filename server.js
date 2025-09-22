const express = require('express');
const cors = require('cors');
// const path = require('path'); // Não é necessário se não serve arquivos estáticos
const { Produto, Contato, sequelize } = require('./database');

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
        folder: 'lojacastro', 
        format: async (req, file) => 'jpg',
        public_id: (req, file) => Date.now() + '-' + file.originalname,
    },
});

const upload = multer({ storage: storage });

// --- CONFIGURAÇÃO DO SERVIDOR ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- REMOÇÃO DO SERVIÇO DE ARQUIVOS ESTÁTICOS ---
// REMOVIDO: Se o Frontend está no GitHub Pages, estas linhas não são necessárias aqui.
// const frontendPath = path.join(__dirname, 'public'); 
// app.use(express.static(frontendPath)); 

// Rota de teste simples (Se você acessar a raiz do Render, ele apenas diz 'API online')
app.get('/', (req, res) => {
    res.send('API Loja DeCastro Backend Online');
});


// --- ROTAS DA API ---

// 1. Rota GET para Produtos (Listagem)
app.get('/api/produtos', async (req, res) => {
    try {
        const produtos = await Produto.findAll();
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
        const imagemUrl = req.file.path;

        const novoProduto = await Produto.create({
            nome,
            preco: parseFloat(preco),
            descricao,
            imagem: imagemUrl
        });

        res.status(201).json(novoProduto);
    } catch (error) {
        console.error("ERRO CRÍTICO NA ROTA POST /api/produtos:", error); 
        res.status(500).send({ message: "ERRO DE PRODUTO: VERIFIQUE O LOG DO RENDER" }); 
    }
});

// 3. Rota POST para Contatos (Cadastro)
app.post('/api/contatos', async (req, res) => {
    try {
        const { nome, email, assunto, mensagem } = req.body;
        
        const novoContato = await Contato.create({
            nome,
            email,
            assunto,
            mensagem,
        });

        res.status(201).json({ message: 'Mensagem enviada com sucesso!', contato: novoContato });

    } catch (error) {
        console.error("ERRO CRÍTICO NA ROTA POST /api/contatos:", error);
        res.status(500).send({ message: "ERRO DE CONTATO: VERIFIQUE O LOG DO RENDER" });
    }
});

// 4. Rota GET para Contatos (Listagem)
app.get('/api/contatos', async (req, res) => {
    try {
        const contatos = await Contato.findAll({
            attributes: ['id', 'nome', 'email', 'assunto', 'mensagem', 'createdAt'],
            order: [['createdAt', 'DESC']]
        }); 
        
        res.json(contatos); 

    } catch (error) {
        console.error("ERRO CRÍTICO NA ROTA GET /api/contatos:", error);
        res.status(500).send({ message: "Erro ao carregar as mensagens de contato." });
    }
});


// --- INICIA O SERVIDOR ---
sequelize.sync({ alter: true })
    .then(() => {
        app.listen(PORT, () => {
            console.log("Banco de dados sincronizado (SQLite) com sucesso!");
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Erro ao sincronizar o banco de dados:', error);
    });
