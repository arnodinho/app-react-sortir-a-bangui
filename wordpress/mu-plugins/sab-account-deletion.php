<?php
/**
 * Plugin Name: Sortir à Bangui – Suppression de compte
 * Description: Suppression de compte exigée par Google Play :
 *              1) page publique /supprimer-mon-compte/ (demande d'effacement sans l'app, via le
 *                 système « Effacer les données personnelles » de WordPress, confirmée par e-mail) ;
 *              2) endpoint REST POST /wp-json/sab/v1/account/delete (suppression immédiate depuis
 *                 l'app, utilisateur connecté via JWT).
 * Version:     1.0.0
 *
 * Installation : copier ce fichier dans wp-content/mu-plugins/. Rien à activer.
 *
 * Ce qui est supprimé pour un compte :
 *  - le compte utilisateur et ses métadonnées (profil, photo de profil, favoris…) ;
 *  - les médias qu'il a envoyés et qui ne servent à aucune place (ex. photo de profil).
 * Ce qui est conservé :
 *  - TOUTES ses places (publiées ou en attente), avec leurs photos, transférées au compte
 *    administrateur SAB_DELETION_REASSIGN_LOGIN (contenu d'intérêt public sur un établissement) ;
 *  - ses avis, anonymisés (nom « Utilisateur supprimé », e-mail effacé).
 */

if (!defined('ABSPATH')) {
    exit;
}

const SAB_DELETION_PAGE_SLUG = 'supprimer-mon-compte';

/** Compte administrateur qui reprend les places d'un compte supprimé. */
const SAB_DELETION_REASSIGN_LOGIN = 'joel';

/** ID du compte repreneur : SAB_DELETION_REASSIGN_LOGIN, sinon le premier administrateur. */
function sab_deletion_reassign_user_id()
{
    $user = get_user_by('login', SAB_DELETION_REASSIGN_LOGIN);
    if ($user && user_can($user, 'manage_options')) {
        return (int) $user->ID;
    }
    $admins = get_users(['role' => 'administrator', 'number' => 1, 'fields' => 'ID', 'orderby' => 'ID']);
    return $admins ? (int) $admins[0] : 0;
}

/* -------------------------------------------------------------------------
 * Suppression effective d'un compte (utilisée par l'endpoint REST)
 * ---------------------------------------------------------------------- */

function sab_delete_account($user_id)
{
    require_once ABSPATH . 'wp-admin/includes/user.php';

    $user = get_userdata($user_id);
    if (!$user) {
        return new WP_Error('sab_account_not_found', 'Compte introuvable.', ['status' => 404]);
    }
    // Garde-fou : jamais de suppression d'un administrateur depuis l'app.
    if (user_can($user, 'manage_options')) {
        return new WP_Error('sab_account_admin', 'Ce compte ne peut pas être supprimé depuis l\'application.', ['status' => 403]);
    }

    $admin_id = sab_deletion_reassign_user_id();
    if (!$admin_id) {
        // Sans repreneur, on refuse plutôt que de perdre les places.
        return new WP_Error('sab_account_no_admin', 'Aucun compte administrateur pour reprendre les places.', ['status' => 500]);
    }

    // 1. Places (tous statuts) : conservées et transférées à l'administrateur, avec leurs photos
    //    (image principale, galerie, médias attachés), sinon wp_delete_user() supprimerait ces
    //    médias avec le compte.
    $places = get_posts([
        'post_type'      => 'listar',
        'post_status'    => 'any',
        'author'         => $user_id,
        'fields'         => 'ids',
        'posts_per_page' => -1,
    ]);
    foreach ($places as $post_id) {
        wp_update_post(['ID' => $post_id, 'post_author' => $admin_id]);

        $media_ids = array_filter(array_map('intval', array_merge(
            [get_post_meta($post_id, '_thumbnail_id', true)],
            explode(',', (string) get_post_meta($post_id, 'gallery', true)),
            get_children(['post_parent' => $post_id, 'post_type' => 'attachment', 'fields' => 'ids'])
        )));
        foreach (array_unique($media_ids) as $media_id) {
            if ((int) get_post_field('post_author', $media_id) === (int) $user_id) {
                wp_update_post(['ID' => $media_id, 'post_author' => $admin_id]);
            }
        }
    }

    // 2. Avis : anonymisés.
    $comments = get_comments(['user_id' => $user_id, 'fields' => 'ids']);
    foreach ($comments as $comment_id) {
        wp_update_comment([
            'comment_ID'           => $comment_id,
            'user_id'              => 0,
            'comment_author'       => 'Utilisateur supprimé',
            'comment_author_email' => '',
            'comment_author_url'   => '',
            'comment_author_IP'    => '',
        ]);
    }

    // 3. Compte + contenus restants (médias sans place : photo de profil…), sans réattribution.
    if (!wp_delete_user($user_id)) {
        return new WP_Error('sab_account_delete_failed', 'La suppression a échoué.', ['status' => 500]);
    }
    return true;
}

add_action('rest_api_init', function () {
    register_rest_route('sab/v1', '/account/delete', [
        'methods'             => 'POST',
        'callback'            => function () {
            $result = sab_delete_account(get_current_user_id());
            return is_wp_error($result) ? $result : ['success' => true];
        },
        // Utilisateur authentifié (le plugin JWT renseigne l'utilisateur courant).
        'permission_callback' => function () {
            return is_user_logged_in();
        },
    ]);
});

/* -------------------------------------------------------------------------
 * Page publique /supprimer-mon-compte/
 * ---------------------------------------------------------------------- */

add_action('template_redirect', function () {
    $path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '', '/');
    if ($path !== SAB_DELETION_PAGE_SLUG) {
        return;
    }

    $notice = '';
    $error  = '';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
        if (!wp_verify_nonce($_POST['_sab_nonce'] ?? '', 'sab_account_deletion')) {
            $error = 'La session a expiré, merci de réessayer.';
        } elseif (trim((string) ($_POST['website'] ?? '')) !== '') {
            // Champ piège rempli : robot. On affiche le même message qu'en cas de succès.
            $notice = sab_deletion_success_message();
        } elseif (!is_email($email)) {
            $error = 'Merci de saisir une adresse e-mail valide.';
        } else {
            // Demande d'effacement WordPress : envoie un e-mail de confirmation à l'adresse saisie.
            // Si aucun compte n'existe avec cette adresse, on affiche le même message (pas de fuite).
            if (email_exists($email)) {
                $request_id = wp_create_user_request($email, 'remove_personal_data');
                if (!is_wp_error($request_id)) {
                    wp_send_user_request($request_id);
                }
            }
            $notice = sab_deletion_success_message();
        }
    }

    status_header(200);
    nocache_headers();
    header('Content-Type: text/html; charset=UTF-8');
    echo sab_deletion_page_html($notice, $error);
    exit;
});

function sab_deletion_success_message()
{
    return "Si un compte est associé à cette adresse, vous allez recevoir un e-mail pour confirmer votre demande. "
        . "Après confirmation, votre compte et vos données seront supprimés sous 30 jours maximum.";
}

function sab_deletion_page_html($notice, $error)
{
    $nonce  = wp_create_nonce('sab_account_deletion');
    $action = esc_url(home_url('/' . SAB_DELETION_PAGE_SLUG . '/'));
    ob_start();
    ?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Supprimer mon compte – Sortir à Bangui</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f7fa; color: #222; margin: 0; }
  main { max-width: 640px; margin: 0 auto; padding: 32px 16px 48px; }
  h1 { font-size: 1.6rem; margin: 0 0 8px; }
  h2 { font-size: 1.1rem; margin: 28px 0 8px; }
  .card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-top: 16px; }
  label { display: block; font-weight: 600; margin-bottom: 6px; }
  input[type=email] { width: 100%; box-sizing: border-box; padding: 12px; font-size: 1rem; border: 1px solid #ccd; border-radius: 8px; }
  button { margin-top: 12px; background: #d9534f; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 1rem; cursor: pointer; }
  .notice { background: #e8f5e9; color: #1b5e20; padding: 12px; border-radius: 8px; }
  .error { background: #fdecea; color: #b71c1c; padding: 12px; border-radius: 8px; }
  .hp { position: absolute; left: -9999px; }
  ul { padding-left: 20px; } li { margin: 4px 0; }
  .muted { color: #666; font-size: .9rem; }
</style>
</head>
<body>
<main>
  <h1>Supprimer mon compte</h1>
  <p class="muted">Application <strong>Sortir à Bangui</strong> – éditeur : Yanga Consulting</p>

  <h2>Depuis l'application</h2>
  <p>Ouvrez l'onglet <strong>Compte</strong>, puis touchez <strong>« Supprimer mon compte »</strong> et confirmez.
     La suppression est immédiate.</p>

  <h2>Sans l'application</h2>
  <div class="card">
    <?php if ($notice) : ?><p class="notice"><?php echo esc_html($notice); ?></p><?php endif; ?>
    <?php if ($error) : ?><p class="error"><?php echo esc_html($error); ?></p><?php endif; ?>
    <?php if (!$notice) : ?>
    <form method="post" action="<?php echo $action; ?>">
      <label for="email">Adresse e-mail de votre compte</label>
      <input type="email" id="email" name="email" required autocomplete="email">
      <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <input type="hidden" name="_sab_nonce" value="<?php echo esc_attr($nonce); ?>">
      <button type="submit">Demander la suppression</button>
    </form>
    <p class="muted">Un e-mail de confirmation vous sera envoyé pour vérifier que vous êtes bien le titulaire du compte.</p>
    <?php endif; ?>
  </div>

  <h2>Données supprimées</h2>
  <ul>
    <li>Votre compte : identifiant, e-mail, mot de passe, nom, description, site web ;</li>
    <li>votre photo de profil ;</li>
    <li>vos favoris.</li>
  </ul>

  <h2>Données conservées</h2>
  <ul>
    <li>Vos avis restent visibles mais sont <strong>anonymisés</strong> (« Utilisateur supprimé ») ;</li>
    <li>les places que vous avez proposées (publiées ou en attente de validation) et leurs photos
        restent dans l'annuaire : ce sont des informations publiques sur des établissements. Elles sont
        transférées à l'équipe Sortir à Bangui et ne sont plus liées à votre compte ;</li>
    <li>des statistiques d'utilisation (Firebase Analytics), associées à un identifiant technique et non à
        votre nom ou e-mail, peuvent être conservées jusqu'à 14 mois.</li>
  </ul>

  <p class="muted">Une question ? Écrivez-nous à <a href="mailto:contact@yanga-consulting.com">contact@yanga-consulting.com</a>.</p>
</main>
</body>
</html>
    <?php
    return ob_get_clean();
}
