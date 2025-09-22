// database.js (Corrigido para usar SQLite)

// 1. CORREÇÃO CRÍTICA: REINTRODUZ A IMPORTAÇÃO DO SEQUELIZE
const { Sequelize, DataTypes } = require('sequelize');

// A conexão usará o sqlite:db.sqlite, pois o bloco de 'dialect: postgres' foi removido
const DATABASE_URL = process.env.DATABASE_URL || 'sqlite:db.sqlite';

const sequelize = new Sequelize(DATABASE_URL, {
    // 2. CORREÇÃO CRÍTICA: Apenas logging: false é necessário para o SQLite
    logging: false // Mantenha esta linha DESCOMENTADA
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
    // O campo 'assunto' está correto
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
        // Mude a mensagem para refletir o SQLite:
        console.log("Banco de dados sincronizado (SQLite) com sucesso!");
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
