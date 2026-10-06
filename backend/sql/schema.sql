CREATE DATABASE IF NOT EXISTS turnos_odontologia;
USE turnos_odontologia;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','odontologo') NOT NULL
);

CREATE TABLE pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  apellido VARCHAR(60) NOT NULL,
  dni VARCHAR(8) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL,
  telefono VARCHAR(15) NOT NULL,
  obra_social VARCHAR(50) NULL
);

CREATE TABLE turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo CHAR(7) NOT NULL UNIQUE,
  paciente_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado ENUM('pendiente','confirmado','cancelado','atendido') NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  INDEX idx_fecha_hora (fecha, hora)
);
