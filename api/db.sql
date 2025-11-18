-- Active: 1750763277253@@127.0.0.1@3306@clockin
create database clockin;
use clockin;

create table users(
    id int not null AUTO_INCREMENT,
    name varchar(100) not null,
    email varchar(100) not null,
    password varchar(100) not null,
    primary key (id)
);

create table admins(
    id int AUTO_INCREMENT not null,
    user_id int not null,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    Foreign Key (user_id) REFERENCES users(id) ON DELETE CASCADE
);

create table reset_password(
    id int not null AUTO_INCREMENT,
    user_id int not null,
    resetToken varchar(8) not null,
    expires_at DATETIME NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    Foreign Key (user_id) REFERENCES users(id) ON DELETE CASCADE
);

create table logins(
    id int not null AUTO_INCREMENT,
    user_id int not null,
    token varchar(255) not null,
    login_time datetime DEFAULT CURRENT_TIMESTAMP not null,
    primary key (id),
    foreign key (user_id) references users(id) ON DELETE CASCADE
);


create table configs(
    id int not null AUTO_INCREMENT,
    user_id int not null,
    config_key varchar(100) not null,
    config_value varchar(255) not null,
    primary key (id),
    foreign key (user_id) references users(id) ON DELETE CASCADE
);

create table nominals(
    id int AUTO_INCREMENT,
    user_id int NOT NULL,
    dia_semana ENUM('Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado') NOT NULL,
    hora1 time,
    hora2 time,
    hora3 time,
    hora4 time,
    hora5 time,
    hora6 time,
    
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

create table registros(
    id int AUTO_INCREMENT,
    user_id int NOT NULL,
    data_registro date NOT NULL,
    hora1 time,
    hora2 time,
    hora3 time,
    hora4 time,
    hora5 time,
    hora6 time,
    obs text,
    mode ENUM('ferias', 'folga', 'feriado', 'feriado manha', 'feriado tarde', 'bonificado', 'atestado', 'atestado manha', 'atestado tarde'),
    
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE saldos(
    id int not NULL AUTO_INCREMENT,
    user_id int not null,
    periodo date not null,
    saldo_sys int not null,
    saldo_100 int not null,
    s100_pg BOOLEAN DEFAULT false,
    ajuste int,
    obs text,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

);

CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    level ENUM('info', 'warn', 'error', 'debug') DEFAULT 'info',
    context VARCHAR(100) NULL,
    message TEXT NOT NULL,
    data JSON NULL,
    ip VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
