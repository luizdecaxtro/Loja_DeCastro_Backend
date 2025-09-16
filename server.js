const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- Configuração e definições de caminho ---
const dataDir = path.join(__dirname, 'data');
const contatosFilePath = path.join(dataDir, 'contatos.json');
const produtosFilePath = path.join(dataDir, 'produtos.json');
const sobreFilePath = path.join(__dirname, 'data', 'sobre.json');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// --- Middleware para servir arquivos estáticos ---
// Esta é a linha que resolve o problema. Ela deve vir antes de qualquer rota da API.
const frontendPath = path.join(__dirname, '..', 'Loja_DeCastro_Frontend');
app.use(express.static(frontendPath));

// Serve a pasta 'uploads' na URL /uploads para que as imagens sejam acessíveis
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// --- Rotas da API (CRUD) ---

// Rota para obter a lista de produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const data = await fs.readFile(produtosFilePath, 'utf8');
        const produtos = JSON.parse(data);
        res.json(produtos);
    }   catch (error) {
        console.error('Erro ao ler o arquivo de produtos:', error);
        res.status(500).json({ error: 'Erro ao carregar a lista de produtos' });
    }
});

// Rota para adicionar um novo produto
app.post('/api/produtos', upload.single('imagem'), async (req, res) => {
    try {
        const produtos = JSON.parse(await fs.readFile(produtosFilePath, 'utf8'));
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

// Rota para obter um único produto por ID
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

// Rota para atualizar um produto existente
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

// Rota para excluir um produto
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

// Rotas da API de Contatos
app.get('/api/contatos', async (req, res) => {
    try {
        const data = await fs.readFile(contatosFilePath, 'utf8');
        const contatos = JSON.parse(data);
        res.json(contatos);
    } catch (error) {
        console.error('Erro ao ler o arquivo de contatos:', error);
        res.status(500).json({ error: 'Erro ao carregar as mensagens' });
    }
});

app.post('/api/contatos', async (req, res) => {
    try {
        const novoContato = req.body;
        novoContato.dataEnvio = new Date().toISOString();

        await fs.mkdir(dataDir, { recursive: true });

        let contatos = [];
        try {
            const data = await fs.readFile(contatosFilePath, 'utf8');
            contatos = JSON.parse(data);
        } catch (readError) {
            // Arquivo não existe, vamos criar um novo com a mensagem atual
        }

        contatos.push(novoContato);
        await fs.writeFile(contatosFilePath, JSON.stringify(contatos, null, 2));

        console.log('Mensagem salva com sucesso:', novoContato);
        res.status(200).json({ message: 'Mensagem enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar a mensagem:', error);
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
});