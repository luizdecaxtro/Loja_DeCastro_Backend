// imports necessários
const express = require('express');
const app = express();
const cors = require('cors');
const { Produto, Contato } = require('./database'); // **IMPORTA OS MODELOS CORRETOS**
const multer = require('multer');

// Imports do Cloudinary
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ... (Restante do setup)

// Configuração do Cloudinary (Pega as Variaveis de Ambiente do Render)
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

// CONFIGURAÇÃO DO MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// ARQUIVOS ESTÁTICOS
// Esta linha é crucial para servir as imagens enviadas pelo usuário na pasta 'uploads'
// Ex: Se o caminho da imagem no JSON for "/uploads/minha-foto.jpg", o servidor irá procurar em "uploads/minha-foto.jpg".
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath)); // Mapeia /uploads para a pasta física

// --- ROTAS DA API ---


// Rota para cadastrar novo produto
app.post('/api/produtos', upload.single('imagem'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "É necessário enviar um arquivo de imagem." });
        }

        const { nome, preco, descricao } = req.body;
        const imagemUrl = req.file.path; // URL do Cloudinary

        const novoProduto = await Produto.create({
            nome,
            preco: parseFloat(preco),
            descricao,
            imagem: imagemUrl // SALVA A URL COMPLETA
        });

        res.status(201).json(novoProduto);
    } catch (error) {
        console.error("Erro ao cadastrar produto (Cloudinary/Sequelize):", error);
        res.status(500).send({ message: "Erro interno ao salvar o produto." });
    }
});

app.get('/api/produtos/:id', async (req, res) => {
    try {
        const produtos = JSON.parse(await fs.readFile(produtosFilePath, 'utf8'));
        const produto = produtos.find(p => p.id === parseInt(req.params.id));
        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.json(produto);
    } catch (error) {
        console.error('Erro ao buscar produto por ID:', error);
        res.status(500).json({ message: 'Erro ao buscar o produto.' });
    }
});

app.put('/api/produtos/:id', upload.single('imagem'), async (req, res) => {
    try {
        const produtos = JSON.parse(await fs.readFile(produtosFilePath, 'utf8'));
        const { nome, preco, descricao } = req.body;
        const id = parseInt(req.params.id);
        const produtoIndex = produtos.findIndex(p => p.id === id);
        if (produtoIndex === -1) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        const produtoAtualizado = produtos[produtoIndex];
        produtoAtualizado.nome = nome;
        produtoAtualizado.preco = parseFloat(preco);
        produtoAtualizado.descricao = descricao;
        if (req.file) {
            produtoAtualizado.imagem = `/uploads/${req.file.filename}`;
        }
        await fs.writeFile(produtosFilePath, JSON.stringify(produtos, null, 2));
        res.status(200).json(produtoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro ao atualizar o produto.' });
    }
});

app.delete('/api/produtos/:id', async (req, res) => {
    try {
        const produtos = JSON.parse(await fs.readFile(produtosFilePath, 'utf8'));
        const idParaExcluir = parseInt(req.params.id);
        const produtosFiltrados = produtos.filter(p => p.id !== idParaExcluir);
        if (produtos.length === produtosFiltrados.length) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        await fs.writeFile(produtosFilePath, JSON.stringify(produtosFiltrados, null, 2));
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ message: 'Erro ao excluir o produto.' });
    }
});

// Rota para salvar um novo contato
app.post('/api/contatos', async (req, res) => {
    try {
        const { nome, email, telefone, mensagem } = req.body;
        
        const novoContato = await Contato.create({
            nome,
            email,
            telefone,
            mensagem
        });

        res.status(201).json(novoContato);
    } catch (error) {
        console.error("Erro ao salvar contato:", error);
        res.status(500).send({ message: "Erro interno ao salvar o contato." });
    }
});

// Rota de Contatos (POST) - A ROTA CORRETA E COMPATÍVEL
app.post('/api/contatos', async (req, res) => {
    try {
        const dadosRecebidos = req.body;
        
        // 1. VALIDAÇÃO AJUSTADA: Nome, Email e Mensagem são obrigatórios. (Assunto não é)
        if (!dadosRecebidos.nome || !dadosRecebidos.email || !dadosRecebidos.mensagem) {
            return res.status(400).json({ message: 'Nome, Email e Mensagem são obrigatórios.' });
        }

        let contatos = [];
        try {
            const data = await fs.readFile(contatosFilePath, 'utf8');
            contatos = JSON.parse(data);
        } catch (readError) {
            // Se o arquivo não existir ou estiver vazio/corrompido, inicia como array vazio.
            contatos = [];
        }

        // 2. ID MAIS ROBUSTO: Usando timestamp (Date.now())
        const contatoParaSalvar = {
            id: Date.now(), 
            nome: dadosRecebidos.nome,
            email: dadosRecebidos.email,
            assunto: dadosRecebidos.assunto || 'Sem Assunto', // Inclui Assunto
            mensagem: dadosRecebidos.mensagem,
            dataEnvio: new Date().toISOString()
        };
        
        contatos.push(contatoParaSalvar);

        await fs.writeFile(contatosFilePath, JSON.stringify(contatos, null, 2));

        console.log('Mensagem salva com sucesso:', contatoParaSalvar);
        res.status(201).json({ message: 'Mensagem enviada com sucesso!', contato: contatoParaSalvar });

    } catch (error) {
        console.error('ERRO INTERNO DO SERVIDOR AO SALVAR CONTATO:', error);
        res.status(500).json({ message: 'Erro ao salvar a mensagem.', error: error.message });
    }
});

// Rotas da API da página "Sobre"
app.get('/api/sobre', async (req, res) => {
    try {
        const data = await fs.readFile(sobreFilePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Erro ao carregar o conteúdo da página Sobre:', error);
        if (error.code === 'ENOENT') {
            return res.json({});
        }
        res.status(500).json({ error: 'Erro ao carregar o conteúdo.' });
    }
});

app.post('/api/sobre', async (req, res) => {
    try {
        await fs.writeFile(sobreFilePath, JSON.stringify(req.body, null, 2));
        res.status(200).json({ message: 'Conteúdo salvo com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar o conteúdo da página Sobre:', error);
        res.status(500).json({ message: 'Erro ao salvar o conteúdo.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`URL Base da API: /api/`); 

});

