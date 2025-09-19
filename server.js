const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
// Esta linha é crucial para servir as imagens pré-existentes na pasta 'public'
// Ex: Se o caminho da imagem no JSON for "/produto1.jpg", o servidor irá procurar em "public/produto1.jpg".
app.use(express.static('public')); 
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ADAPTAÇÃO PARA PRODUÇÃO: Configuração de CORS
app.use(cors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

// CONFIGURAÇÃO DE CAMINHOS
const dataDir = path.join(__dirname, 'data');
const contatosFilePath = path.join(dataDir, 'contatos.json');
const produtosFilePath = path.join(dataDir, 'produtos.json');
const sobreFilePath = path.join(__dirname, 'data', 'sobre.json');

// CONFIGURAÇÃO DO MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Assegure-se de que a pasta 'uploads' existe antes de tentar salvar
        fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true }).then(() => {
            cb(null, path.join(__dirname, 'uploads/'));
        });
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

// Rotas de Produtos (GET, POST, PUT, DELETE)
app.get('/api/produtos', async (req, res) => {
    try {
        const data = await fs.readFile(produtosFilePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Erro ao ler o arquivo de produtos:', error);
        if (error.code === 'ENOENT') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Erro ao carregar a lista de produtos' });
    }
});

app.post('/api/produtos', upload.single('imagem'), async (req, res) => {
    try {
        console.log('Recebendo requisição para adicionar produto...');
        console.log('Corpo da requisição:', req.body);
        console.log('Arquivo recebido:', req.file);

        let produtos = [];
        try {
            const data = await fs.readFile(produtosFilePath, 'utf8');
            produtos = JSON.parse(data);
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                console.log('Arquivo de produtos não encontrado. Criando um novo.');
            } else {
                throw readError;
            }
        }
        
        const { nome, preco, descricao } = req.body;
        const novoProduto = {
            id: Date.now(),
            nome: nome,
            preco: parseFloat(preco),
            descricao: descricao,
            imagem: req.file ? `/uploads/${req.file.filename}` : null
        };
        produtos.push(novoProduto);
        await fs.writeFile(produtosFilePath, JSON.stringify(produtos, null, 2));
        res.status(201).json(novoProduto);
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        res.status(500).json({ message: 'Erro ao adicionar o produto.' });
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

// Rotas de Contatos (GET)
app.get('/api/contatos', async (req, res) => {
    try {
        const data = await fs.readFile(contatosFilePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Erro ao ler o arquivo de contatos:', error);
        if (error.code === 'ENOENT') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Erro ao carregar as mensagens' });
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
