<?php
define('DB_HOST','localhost');
define('DB_NAME','apiseries');
define('DB_USER','root');
define('DB_PASS',''); // '' par défaut sur windows

try
{
    // Try to connect to database
	$pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME,DB_USER,DB_PASS,array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8'));

    // Set fetch mode to object
	$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_OBJ);
}
catch (Exception $e)
{
    // Failed to connect
	die('Could not connect');
}