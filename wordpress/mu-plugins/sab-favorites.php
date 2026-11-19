<?php
/**
 * Plugin Name: Sortir à Bangui – Favoris
 * Description: Favoris des utilisateurs de l'app (sab/v1/favorites), indépendants de la licence Listar.
 * Version:     1.1.0
 *
 * Installation : copier ce fichier dans wp-content/mu-plugins/ (chargé automatiquement).
 *
 * Pourquoi : dans Listar, l'ajout d'un favori (listar/v1/wishlist/save) est réservé à la version
 * Pro (licence). Ces routes réimplémentent les favoris sans toucher à Listar, avec le MÊME stockage
 * que lui, pour que tout le reste continue de fonctionner :
 * - usermeta « _like_post » : une ligne par place et par utilisateur (lu par Listar pour le
 *   champ « wishlist » des places, et par sab-popular.php pour le classement) ;
 * - post meta « _wishlist_count » : compteur par place, tenu à jour comme le fait Listar.
 *
 * Routes (utilisateur connecté, JWT) — réponses au format de Listar :
 *   GET  sab/v1/favorites          ?page=&per_page=   → {success, data: [places], pagination}
 *   POST sab/v1/favorites/add      post_id            → {success, message}
 *   POST sab/v1/favorites/remove   post_id            → {success, message}
 *   POST sab/v1/favorites/reset                       → {success, message}
 *
 * Journal : chaque retrait/vidage est écrit dans le log PHP (error_log), préfixe
 * « [sab-favorites] », avec l'id utilisateur, la route et les places concernées
 * (pas d'IP ni de nom). Couvre aussi listar/v1/wishlist/remove|reset, encore
 * appelées par les versions ≤ 2.1.0 de l'app.
 */

if (!defined('ABSPATH')) {
    exit;
}

const SAB_FAVORITES_META      = '_like_post';
const SAB_FAVORITES_COUNT     = '_wishlist_count';
const SAB_FAVORITES_POST_TYPE = 'listar';

add_action('rest_api_init', function () {
    $auth = function () {
        return is_user_logged_in()
            ? true
            : new WP_Error('rest_permission', 'Vous devez être connecté.', ['status' => 401]);
    };
    $post_id = [
        'required'          => true,
        'sanitize_callback' => 'absint',
    ];

    register_rest_route('sab/v1', '/favorites', [
        'methods'             => 'GET',
        'callback'            => 'sab_favorites_list',
        'permission_callback' => $auth,
        'args'                => [
            'page'     => ['default' => 1, 'sanitize_callback' => 'absint'],
            'per_page' => ['default' => 20, 'sanitize_callback' => 'absint'],
        ],
    ]);
    register_rest_route('sab/v1', '/favorites/add', [
        'methods'             => 'POST',
        'callback'            => 'sab_favorites_add',
        'permission_callback' => $auth,
        'args'                => ['post_id' => $post_id],
    ]);
    register_rest_route('sab/v1', '/favorites/remove', [
        'methods'             => 'POST',
        'callback'            => 'sab_favorites_remove',
        'permission_callback' => $auth,
        'args'                => ['post_id' => $post_id],
    ]);
    register_rest_route('sab/v1', '/favorites/reset', [
        'methods'             => 'POST',
        'callback'            => 'sab_favorites_reset',
        'permission_callback' => $auth,
    ]);
});

/** Une ligne dans le log PHP pour chaque retrait/vidage de favoris. */
function sab_favorites_log($action, $route, array $post_ids)
{
    error_log(sprintf(
        '[sab-favorites] %s user=%d route=%s posts=%s',
        $action,
        get_current_user_id(),
        $route,
        $post_ids ? implode(',', $post_ids) : '-'
    ));
}

// Anciennes versions de l'app : routes Listar (non modifiées), journalisées avant exécution.
add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    $route = $request->get_route();
    if ($route === '/listar/v1/wishlist/remove') {
        sab_favorites_log('remove', $route, [(int) $request['post_id']]);
    } elseif ($route === '/listar/v1/wishlist/reset') {
        sab_favorites_log('reset', $route, sab_favorites_ids(get_current_user_id()));
    }
    return $result;
}, 10, 3);

/** Ids des places en favori de l'utilisateur (entiers, sans doublon). */
function sab_favorites_ids($user_id)
{
    return array_values(array_unique(array_map('intval', get_user_meta($user_id, SAB_FAVORITES_META))));
}

function sab_favorites_has($user_id, $post_id)
{
    return in_array((int) $post_id, sab_favorites_ids($user_id), true);
}

function sab_favorites_bump_count($post_id, $delta)
{
    $count = max(0, (int) get_post_meta($post_id, SAB_FAVORITES_COUNT, true) + $delta);
    update_post_meta($post_id, SAB_FAVORITES_COUNT, $count);
}

function sab_favorites_list(WP_REST_Request $request)
{
    $ids      = sab_favorites_ids(get_current_user_id());
    $page     = max(1, (int) $request['page']);
    $per_page = min(50, max(1, (int) $request['per_page']));

    $query = new WP_Query([
        'post_type'      => SAB_FAVORITES_POST_TYPE,
        'post_status'    => 'publish',
        'post__in'       => $ids ?: [0],
        'paged'          => $page,
        'posts_per_page' => $per_page,
    ]);
    $posts = $query->posts;

    $model = '\\ListarWP\\Plugin\\Models\\Place_Model';
    if (class_exists($model)) {
        foreach ($posts as &$post) {
            $model::assign_data_list($post);
        }
        unset($post);
    }

    $total = (int) $query->found_posts;
    return rest_ensure_response([
        'success'    => true,
        'data'       => $posts,
        'pagination' => [
            'page'     => $page,
            'per_page' => $per_page,
            'max_page' => (int) ceil($total / $per_page),
            'total'    => $total,
        ],
    ]);
}

function sab_favorites_add(WP_REST_Request $request)
{
    $user_id = get_current_user_id();
    $post    = get_post((int) $request['post_id']);
    if (!$post || $post->post_type !== SAB_FAVORITES_POST_TYPE || $post->post_status !== 'publish') {
        return new WP_Error('sab_favorites_invalid_post', 'Lieu introuvable.', ['status' => 404]);
    }
    if (!sab_favorites_has($user_id, $post->ID)) {
        add_user_meta($user_id, SAB_FAVORITES_META, $post->ID);
        sab_favorites_bump_count($post->ID, 1);
    }
    return rest_ensure_response(['success' => true, 'message' => 'Ajouté aux favoris.']);
}

function sab_favorites_remove(WP_REST_Request $request)
{
    $user_id = get_current_user_id();
    $post_id = (int) $request['post_id'];
    // Pas de contrôle du statut : on doit pouvoir retirer une place dépubliée.
    if (sab_favorites_has($user_id, $post_id)) {
        sab_favorites_log('remove', $request->get_route(), [$post_id]);
        delete_user_meta($user_id, SAB_FAVORITES_META, $post_id);
        sab_favorites_bump_count($post_id, -1);
    }
    return rest_ensure_response(['success' => true, 'message' => 'Retiré des favoris.']);
}

function sab_favorites_reset(WP_REST_Request $request)
{
    $user_id = get_current_user_id();
    sab_favorites_log('reset', $request->get_route(), sab_favorites_ids($user_id));
    foreach (sab_favorites_ids($user_id) as $post_id) {
        sab_favorites_bump_count($post_id, -1);
    }
    delete_user_meta($user_id, SAB_FAVORITES_META);
    return rest_ensure_response(['success' => true, 'message' => 'Favoris vidés.']);
}
