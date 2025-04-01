const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Connection = sequelize.define('Connection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fromLocationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  toLocationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  transport: {
    type: DataTypes.ENUM('air', 'sea', 'rail', 'truck'),
    allowNull: false
  },
  distance: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  emission: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  time: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  geometry: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

module.exports = Connection; 