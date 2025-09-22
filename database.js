const { Sequelize, DataTypes } = require('sequelize');

// A conexão agora usa a variável de ambiente DATABASE_URL do Render (PostgreSQL)
// Se não encontrar, ele usa uma conexão local (apenas para teste local)
const DATABASE_URL = process.env.DATABASE_URL || 'sqlite:db.sqlite';

const sequelize = new Sequelize(DATABASE_URL, {
    // Configuração para uso do PostgreSQL no Render
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    // O log do console ajuda a ver as consultas SQL
    logging: false 
});

// Define o modelo 'Produto'
const Produto = sequelize.define('Produto', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    preco: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // O campo 'imagem' agora armazena a URL completa do Cloudinary
    imagem: { 
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Define o modelo 'Contato'
const Contato = sequelize.define('Contato', {
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    assunto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mensagem: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

// Sincroniza o banco de dados. 
// 'alter: true' altera as tabelas para corresponder aos modelos.
sequelize.sync({ alter: true })
    .then(() => {
        console.log("Banco de dados sincronizado (PostgreSQL) com sucesso!");
    })
    .catch(err => {
        console.error("Erro ao sincronizar o banco de dados:", err);
    });

// Exporta a instância e os modelos
module.exports = {
    sequelize,
    Produto,
    Contato
};

