<?php
include 'config.php';
// tache cron

$opts = array('http' => array('header' => 'Accept-Charset: UTF-8, *;q=0'));
$context = stream_context_create($opts);

$page_html = file_get_contents('http://www.programme-tv.net/',false,$context);

// preg_match_all('#prog_heure">(.+)<.+type">(.+)<.+prog_name".+>(.+)</a>#',$page_html,$series);
preg_match_all('#channel_label.+<br>(.+)</span>.+prog_heure">(.+)<.+type">(.+)<.+prog_name".+>(.+)</a>#sU',$page_html,$series,PREG_SET_ORDER);


// preg_match_all('#channel_label.+<br>(.+)/\.programme-->.+</span>.+prog_heure">(.+)<.+type">(.+)<.+prog_name".+>(.+)</a>#sU',$page_html,$series2,PREG_SET_ORDER);
preg_match_all('#channel_label.+<br>(.+)</span>.+hr.+</span>.+prog_heure">(.+)<.+type">(.+)<.+prog_name".+>(.+)</a>#sU',$page_html,$series2,PREG_SET_ORDER);

$series = array_merge($series,$series2);

  // 1 => channel
  // 2 => time
  // 4 => name 

function formatTitle($title){
	return str_replace(' ', '+', $title);
}

// TRUNCATE TABLE
$pdo->exec('TRUNCATE TABLE program_tv');


foreach($series as $_series)
{
	// On transforme remplace les ' ' par des '+' pour une meilleure recherche
	$title = formatTitle(html_entity_decode($_series[4]));

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "http://api.themoviedb.org/3/search/tv?api_key=3d0f36482f467a0f9f9af0f3ae7f1e9f&query=".$title);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_HEADER, FALSE);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array("Accept: application/json"));
	$response = curl_exec($ch);
	curl_close($ch);
	$res = json_decode ($response, true, 512 , 0);

	$empty = $res["total_results"];

	// Si l'API n'a retourné aucun résultat c'est que le titre est incorrecte
	if($empty == 0){
		$id = 'error';
	}

	else {
		$id = $res['results'][0]['id'];
	}

	if($id != 'error' && $_series[3] == 'Série TV'){
		$prepare = $pdo->prepare('INSERT INTO program_tv(id,name,channel,time) VALUES (:id,:name,:channel,:time)');
		$prepare->bindValue('id', $id); // 54858

		// $input = html_entity_decode($_series[4]); 
		// $output = preg_replace_callback("/(&#[0-9]+;)/", function($m) { return mb_convert_encoding($m[1], "UTF-8", "HTML-ENTITIES"); }, $input); 
		$prepare->bindValue('name',html_entity_decode($_series[4])); // Un Nom
		
		$prepare->bindValue('channel',$_series[1]); // TF1

		$time = date('Y-m-d H:i:s', time());
		$time = substr($time,0, -8);
		$time .= $_series[2].':00';
		$prepare->bindValue('time',$time); //hh:mm
		$exec = $prepare->execute();
	}

}