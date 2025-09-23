// database.js (Corrigido para usar PostgreSQL)

const { Sequelize, DataTypes } = require('sequelize');

// Usa a variável de ambiente DATABASE_URL fornecida pelo Render
// que contém a URL de conexão do seu banco de dados PostgreSQL.
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    // Desativa os logs do Sequelize para manter o console limpo
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
