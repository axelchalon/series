 <?php
 include 'config.php';
 
 $prepare = $pdo->query('SELECT * FROM program_tv');
 while($series = $prepare->fetch()){
  $id = $series->id;

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, "http://api.themoviedb.org/3/tv/".$id."?api_key=3d0f36482f467a0f9f9af0f3ae7f1e9f");
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($ch, CURLOPT_HEADER, FALSE);
  curl_setopt($ch, CURLOPT_HTTPHEADER, array("Accept: application/json"));
  $response = curl_exec($ch);
  curl_close($ch);

  $res = json_decode ($response, true, 512 , 0);

  $info['serie_name'] = $res['name'];
  $info['time'] = substr($series->time,11,4);

  echo $info['serie_name'];
  echo $info['time'];


  echo '<pre>';
  print_r($res);
  echo '</pre>';


  // echo '<img src=https://image.tmdb.org/t/p/w185/';
}

?>