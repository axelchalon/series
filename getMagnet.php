<?php

header('Access-Control-Allow-Origin: *');

$site=file_get_contents('https://kickass.to/search/'.strtolower($_GET['q']));
// $site=file_get_contents('https://kickass.to/search/game%20of%20thrones%20season%203%20episode%201%20category:tv/');
// echo gzdecoder($site); exit();
preg_match('#Torrent magnet link" href="(.+)"#U',gzdecoder($site),$matches);
echo $matches[1];


function gzdecoder($d){
    $f=ord(substr($d,3,1));
    $h=10;$e=0;
    if($f&4){
        $e=unpack('v',substr($d,10,2));
        $e=$e[1];$h+=2+$e;
    }
    if($f&8){
        $h=strpos($d,chr(0),$h)+1;
    }
    if($f&16){
        $h=strpos($d,chr(0),$h)+1;
    }
    if($f&2){
        $h+=2;
    }
    $u = gzinflate(substr($d,$h));
    if($u===FALSE){
        $u=$d;
    }
    return $u;
}