const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Cria uma instância do Sequelize, conectando-se ao arquivo do banco de dados
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'db.sqlite') // O banco de dados será um arquivo chamado db.sqlite
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
    telefone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mensagem: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

// Exporta a instância e os modelos para serem usados em outros arquivos
module.exports = {
  sequelize,
  Produto,
  Contato // Adicionado o modelo Contato aqui
};

// Sincroniza o banco de dados.
// 'alter: true' altera as tabelas para corresponder aos modelos,
// sem apagar os dados existentes.
//sequelize.sync({ alter: true })
//    .then(() => {
//        console.log("Banco de dados sincronizado com sucesso e tabelas criadas/atualizadas.");
//    })
//    .catch(err => {
//        console.error("Erro ao sincronizar o banco de dados:", err);
//    });

// A função inicializarBanco e a sua chamada foram removidas para evitar
// que o banco de dados seja apagado e os dados de teste sejam inseridos
// a cada reinício do servidor.