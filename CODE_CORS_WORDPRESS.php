<?php
/**
 * Code à ajouter dans functions.php de votre thème WordPress
 * 
 * Localisation : C:\xampp\htdocs\quiz-wordpress\wp-content\themes\twentytwentyfive\functions.php
 * 
 * Ajoutez ce code à la FIN du fichier functions.php
 */

// Autoriser CORS pour l'API REST (Next.js)
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: http://localhost:3000');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        return $value;
    });
}, 15);





