<?php

// Vercel handles vendor autoload automatically if composer.json exists, but just in case:
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple function to convert camelCase keys to snake_case for the frontend
function toSnakeCase($input) {
    if (is_object($input)) {
        $input = (array) $input;
    }
    if (is_array($input)) {
        $output = [];
        foreach ($input as $key => $value) {
            $key = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key));
            if ($key === 'malid') $key = 'mal_id';
            
            // Map common internal Jikan structures
            if ($key === 'images' && is_array($value) && count($value) > 0) {
                 // Fake the v4 wrapper structure
                 $output['images'] = [
                     'jpg' => [
                         'image_url' => $value[0] ?? '',
                         'large_image_url' => $value[0] ?? ''
                     ]
                 ];
            } else {
                 $output[$key] = toSnakeCase($value);
            }
        }
        return $output;
    }
    return $input;
}

try {
    // If jikan is not found, fallback to pure HTTP proxy
    if (!class_exists('Jikan\Jikan') && !class_exists('Jikan\MyAnimeList\MalClient')) {
        $url = 'https://api.jikan.moe/v4' . $_SERVER['REQUEST_URI'];
        $url = str_replace('/api/jikan.php', '', $url);
        echo file_get_contents($url);
        exit;
    }

    $jikan = class_exists('Jikan\MyAnimeList\MalClient') ? new \Jikan\MyAnimeList\MalClient() : new \Jikan\Jikan();
    
    // Parse the path info since frontend sends /api/jikan.php/top/anime
    $pathInfo = $_SERVER['PATH_INFO'] ?? '/';
    $action = '';
    
    if (strpos($pathInfo, '/top/anime') !== false) {
        $action = 'topAnime';
    } elseif (strpos($pathInfo, '/anime') !== false && !isset($_GET['q'])) {
        // detail
        $pathParts = explode('/', trim($pathInfo, '/'));
        if (count($pathParts) >= 2 && is_numeric($pathParts[1])) {
             $action = 'animeDetails';
             $_GET['id'] = $pathParts[1];
        } else {
             $action = 'searchAnime';
        }
    } elseif (strpos($pathInfo, '/seasons/now') !== false) {
        $action = 'seasonNow';
    }

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $query = $_GET['q'] ?? '';

    $response = [];

    switch ($action) {
        case 'topAnime':
            if (class_exists('Jikan\Request\Top\TopAnimeRequest')) {
                $response = $jikan->getTopAnime(new \Jikan\Request\Top\TopAnimeRequest($page));
            } else {
                $response = $jikan->getTopAnime($page);
            }
            break;
        case 'searchAnime':
            if (class_exists('Jikan\Request\Search\AnimeSearchRequest')) {
                $response = $jikan->getAnimeSearch(new \Jikan\Request\Search\AnimeSearchRequest($query, $page));
            } else {
                $response = $jikan->getAnimeSearch($query, $page);
            }
            break;
        case 'seasonNow':
            $response = $jikan->getSeasonNow();
            break;
        case 'animeDetails':
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            $response = $jikan->getAnime($id);
            break;
        default:
            $url = 'https://api.jikan.moe/v4/' . ltrim($action, '/');
            echo file_get_contents($url);
            exit;
    }

    // Return backwards compatible JSON
    $snaked = toSnakeCase($response);
    echo json_encode(['data' => $snaked]);

} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
