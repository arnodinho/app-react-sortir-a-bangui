<?php
/**
 * Plugin Name: Sortir à Bangui – Formulaire de contact (app mobile)
 * Description: Endpoint REST POST /wp-json/sab/v1/contact utilisé par l'écran « Nous contacter »
 *              de l'application mobile. Envoie le message par e-mail via wp_mail().
 * Version:     1.0.0
 *
 * Installation : copier ce fichier dans wp-content/mu-plugins/ (créer le dossier s'il n'existe
 * pas). Les « must-use plugins » sont chargés automatiquement, rien à activer.
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Adresse qui reçoit les messages. */
const SAB_CONTACT_RECIPIENT = 'contact@yanga-consulting.com';

/** Anti-abus : nombre max de messages par adresse IP et par heure. */
const SAB_CONTACT_MAX_PER_HOUR = 5;

add_action('rest_api_init', function () {
    register_rest_route('sab/v1', '/contact', [
        'methods'             => 'POST',
        'callback'            => 'sab_contact_handle',
        'permission_callback' => '__return_true', // formulaire public, l'utilisateur n'a pas à être connecté
        'args'                => [
            'firstname' => ['type' => 'string', 'required' => true],
            'lastname'  => ['type' => 'string', 'required' => true],
            'email'     => ['type' => 'string', 'required' => true],
            'content'   => ['type' => 'string', 'required' => true],
            'site'      => ['type' => 'string', 'required' => false],
            // Champ piège : invisible dans l'app, rempli seulement par les robots.
            'website'   => ['type' => 'string', 'required' => false],
        ],
    ]);
});

function sab_contact_handle(WP_REST_Request $request)
{
    // Robot : on fait comme si tout allait bien, sans envoyer.
    if (trim((string) $request->get_param('website')) !== '') {
        return ['success' => true];
    }

    $firstname = sanitize_text_field($request->get_param('firstname'));
    $lastname  = sanitize_text_field($request->get_param('lastname'));
    $email     = sanitize_email($request->get_param('email'));
    $content   = sanitize_textarea_field($request->get_param('content'));
    $source    = sanitize_text_field($request->get_param('site') ?: 'app');

    if ($firstname === '' || $lastname === '' || $content === '') {
        return new WP_Error('sab_contact_missing', 'Tous les champs sont obligatoires.', ['status' => 400]);
    }
    if (!is_email($email)) {
        return new WP_Error('sab_contact_email', 'Adresse e-mail invalide.', ['status' => 400]);
    }
    if (mb_strlen($content) > 5000) {
        return new WP_Error('sab_contact_too_long', 'Message trop long (5000 caractères max).', ['status' => 400]);
    }

    // Limite par IP (transient d'une heure).
    $ip  = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $key = 'sab_contact_' . md5($ip);
    $count = (int) get_transient($key);
    if ($count >= SAB_CONTACT_MAX_PER_HOUR) {
        return new WP_Error('sab_contact_rate_limited', 'Trop de messages envoyés. Réessayez plus tard.', ['status' => 429]);
    }

    $name    = trim("$firstname $lastname");
    $subject = sprintf('[Sortir à Bangui] Nouveau message de %s', $name);
    $body    = sprintf(
        "Nom : %s\nE-mail : %s\nSource : %s\nDate : %s\n\n%s\n",
        $name,
        $email,
        $source,
        wp_date('d/m/Y H:i'),
        $content
    );
    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        // Répondre directement à l'utilisateur depuis sa messagerie.
        sprintf('Reply-To: %s <%s>', $name, $email),
    ];

    $sent = wp_mail(SAB_CONTACT_RECIPIENT, $subject, $body, $headers);
    if (!$sent) {
        return new WP_Error('sab_contact_send_failed', "Le message n'a pas pu être envoyé.", ['status' => 500]);
    }

    set_transient($key, $count + 1, HOUR_IN_SECONDS);
    return ['success' => true];
}
