<?php
header('Access-Control-Allow-Origin: *');
include 'config.php';

/* LA TABLEAU DANS LA DB DOIT AVOIR LES CHAMPS SUIVANT:
	name
	time
	magnet
*/

	$prepare = $pdo->query('SELECT name,magnet,time,UNIX_TIMESTAMP(time) startsAt FROM public_sessions');
$ret = [];
	while($series = $prepare->fetch()){

		$title = str_replace(' ', '+', $series->name);

	// Appel qui sera vide si le nom n'existe pas
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, "http://api.themoviedb.org/3/search/tv?api_key=3d0f36482f467a0f9f9af0f3ae7f1e9f&query=".$title);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
		curl_setopt($ch, CURLOPT_HEADER, FALSE);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array("Accept: application/json"));
		$response = curl_exec($ch);
		curl_close($ch);
		$res = json_decode ($response, true, 512 , 0);

		$info['name'] = $series->name;
		$timestamp = strtotime($series->time);
		$info['startsAt'] = $series->startsAt;
		$info['startsAt_str'] = date('H:i',$timestamp);
		$info['magnet'] = $series->magnet;
		$info['poster'] = 'https://image.tmdb.org/t/p/w185'.$res['results'][0]['poster_path'];
        array_push($ret,$info);
	}

	echo json_encode($ret);