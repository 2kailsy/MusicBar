-- --------------------------------------------------------
-- 主机:                           127.0.0.1
-- 服务器版本:                        5.5.62-log - MySQL Community Server (GPL)
-- 服务器操作系统:                      Win64
-- HeidiSQL 版本:                  11.3.0.6295
-- --------------------------------------------------------

-- 导出 music 的数据库结构
CREATE DATABASE IF NOT EXISTS `music`
USE `music`;

-- 导出  表 music.list 结构
CREATE TABLE IF NOT EXISTS `list` (
  `listName` varchar(50) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- 导出  表 music.music 结构
CREATE TABLE IF NOT EXISTS `music` (
  `uid` int(11) DEFAULT NULL,
  `lid` int(11) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `author` varchar(50) DEFAULT NULL,
  `rid` int(11) DEFAULT NULL,
  `pic` varchar(500) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- 导出  表 music.users 结构
CREATE TABLE IF NOT EXISTS `users` (
  `mail` varchar(50) DEFAULT NULL,
  `password` varchar(150) DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  `img` varchar(150) DEFAULT NULL,
  `sex` int(11) DEFAULT NULL,
  `sign` varchar(50) DEFAULT NULL,
  `plays` int(11) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
