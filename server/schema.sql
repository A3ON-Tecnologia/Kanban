-- Executar este script no MySQL para criar o banco e as tabelas

CREATE DATABASE IF NOT EXISTS KANBAN
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE KANBAN;

CREATE TABLE IF NOT EXISTS boards (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS columns_tbl (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  board_id    VARCHAR(36)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  position    INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cards (
  id             VARCHAR(36)  NOT NULL PRIMARY KEY,
  column_id      VARCHAR(36)  NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  color          VARCHAR(20)  DEFAULT '',
  priority       VARCHAR(10)  DEFAULT '',
  due_date       VARCHAR(50)  DEFAULT '',
  alert_minutes  INT          DEFAULT 30,
  position       INT          NOT NULL DEFAULT 0,
  created_at     VARCHAR(50)  NOT NULL,
  FOREIGN KEY (column_id) REFERENCES columns_tbl(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checklist_items (
  id            VARCHAR(36)   NOT NULL PRIMARY KEY,
  card_id       VARCHAR(36)   NOT NULL,
  checklist_id  VARCHAR(36)   NULL,
  text          VARCHAR(1000) NOT NULL,
  done          TINYINT(1)    NOT NULL DEFAULT 0,
  position      INT           NOT NULL DEFAULT 0,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checklists (
  id        VARCHAR(36)  NOT NULL PRIMARY KEY,
  card_id   VARCHAR(36)  NOT NULL,
  title     VARCHAR(255) NOT NULL DEFAULT 'Checklist',
  position  INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id        VARCHAR(36)   NOT NULL PRIMARY KEY,
  card_id   VARCHAR(36)   NOT NULL,
  text      TEXT          NOT NULL,
  created_at VARCHAR(50)  NOT NULL,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
) ENGINE=InnoDB;
