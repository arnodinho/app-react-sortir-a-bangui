<?php
/**
 * Plugin Name: Sortir à Bangui – Règle de mot de passe
 * Description: Impose au moins 8 caractères, dont une majuscule et un chiffre, partout où un
 *              mot de passe est défini : inscription depuis l'app (listar/v1/auth/register),
 *              changement depuis l'app (wp/v2/users/me), formulaire « mot de passe oublié » de
 *              WordPress (lien reçu par e-mail), profil dans l'admin, inscription WordPress.
 * Version:     1.0.0
 *
 * Même règle que l'app : source/app/utils/password.js (garder les deux synchronisés).
 * Installation : copier ce fichier dans wp-content/mu-plugins/. Rien à activer.
 */

if (!defined('ABSPATH')) {
    exit;
}

const SAB_PASSWORD_MIN_LENGTH = 8;

/** Renvoie un message d'erreur si le mot de passe ne respecte pas la règle, sinon null. */
function sab_password_policy_error($password)
{
    $password = (string) $password;
    $ok = mb_strlen($password) >= SAB_PASSWORD_MIN_LENGTH
        && preg_match('/\p{Lu}/u', $password)
        && preg_match('/[0-9]/', $password);
    return $ok ? null : 'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule et un chiffre.';
}

/* --- API REST (app mobile) ------------------------------------------------ */

add_filter('rest_pre_dispatch', function ($result, $server, WP_REST_Request $request) {
    if ($result !== null || !in_array($request->get_method(), ['POST', 'PUT', 'PATCH'], true)) {
        return $result;
    }
    $route = $request->get_route();
    $is_register = $route === '/listar/v1/auth/register';
    $is_user_update = (bool) preg_match('#^/wp/v2/users/(me|\d+)$#', $route);
    if (!$is_register && !$is_user_update) {
        return $result;
    }
    $password = $request->get_param('password');
    if ($password === null || $password === '') {
        // Inscription sans mot de passe : laissée à Listar (qui renvoie sa propre erreur) ;
        // mise à jour de profil sans changement de mot de passe : rien à vérifier.
        return $result;
    }
    $error = sab_password_policy_error($password);
    return $error ? new WP_Error('sab_weak_password', $error, ['status' => 400]) : $result;
}, 10, 3);

/* --- Formulaires WordPress ------------------------------------------------- */

// « Mot de passe oublié » → choix du nouveau mot de passe (wp-login.php?action=rp).
add_action('validate_password_reset', function (WP_Error $errors) {
    if (!empty($_POST['pass1'])) {
        $error = sab_password_policy_error(wp_unslash($_POST['pass1']));
        if ($error) {
            $errors->add('sab_weak_password', $error);
        }
    }
});

// Profil dans l'admin (wp-admin/profile.php, user-edit.php).
add_action('user_profile_update_errors', function (WP_Error $errors) {
    if (!empty($_POST['pass1'])) {
        $error = sab_password_policy_error(wp_unslash($_POST['pass1']));
        if ($error) {
            $errors->add('sab_weak_password', $error);
        }
    }
});
