<?php
/**
 * Plugin Name: Sortir à Bangui – Lieux populaires (accueil de l'app)
 * Description: Ajoute « popular » à la réponse de listar/v1/home/init : les 5 places publiées
 *              avec le plus d'interactions (avis/commentaires approuvés + mises en favoris),
 *              complétées par les places les plus récentes s'il y en a moins de 5.
 * Version:     1.0.0
 *
 * Installation : copier ce fichier dans wp-content/mu-plugins/ (chargé automatiquement).
 *
 * Le plugin Listar n'est pas modifié : on enrichit sa réponse via le filtre rest_post_dispatch.
 * L'app lit déjà data.popular en priorité (app/sagas/home.js).
 *
 * Interactions comptées (les vues ne sont pas enregistrées par Listar) :
 * - posts.comment_count : commentaires/avis approuvés, tenu à jour par WordPress ;
 * - favoris : une ligne usermeta « _like_post » = id de la place, par utilisateur.
 */

if (!defined('ABSPATH')) {
    exit;
}

const SAB_POPULAR_LIMIT = 5;

/** Poids de chaque type d'interaction dans le score. */
const SAB_POPULAR_WEIGHT_COMMENT  = 1;
const SAB_POPULAR_WEIGHT_FAVORITE = 1;

add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if ($request->get_route() !== '/listar/v1/home/init' || !($response instanceof WP_REST_Response)) {
        return $response;
    }
    $data = $response->get_data();
    if (empty($data['success']) || !isset($data['data']) || !is_array($data['data'])) {
        return $response;
    }
    $data['data']['popular'] = sab_popular_places(SAB_POPULAR_LIMIT);
    $response->set_data($data);
    return $response;
}, 10, 3);

/** Ids des places classées par interactions (score > 0), puis complétées par les plus récentes. */
function sab_popular_place_ids($limit)
{
    global $wpdb;

    $ids = array_map('intval', $wpdb->get_col($wpdb->prepare(
        "SELECT p.ID
           FROM {$wpdb->posts} p
           LEFT JOIN (
                SELECT CAST(meta_value AS UNSIGNED) AS post_id, COUNT(*) AS favorites
                  FROM {$wpdb->usermeta}
                 WHERE meta_key = '_like_post'
                 GROUP BY meta_value
           ) f ON f.post_id = p.ID
          WHERE p.post_type = 'listar' AND p.post_status = 'publish'
            AND (p.comment_count * %d + COALESCE(f.favorites, 0) * %d) > 0
          ORDER BY (p.comment_count * %d + COALESCE(f.favorites, 0) * %d) DESC, p.post_date DESC
          LIMIT %d",
        SAB_POPULAR_WEIGHT_COMMENT, SAB_POPULAR_WEIGHT_FAVORITE,
        SAB_POPULAR_WEIGHT_COMMENT, SAB_POPULAR_WEIGHT_FAVORITE,
        $limit
    )));

    if (count($ids) < $limit) {
        $recent = get_posts([
            'post_type'      => 'listar',
            'post_status'    => 'publish',
            'orderby'        => 'date',
            'order'          => 'DESC',
            'posts_per_page' => $limit - count($ids),
            'post__not_in'   => $ids,
            'fields'         => 'ids',
        ]);
        $ids = array_merge($ids, array_map('intval', $recent));
    }

    return $ids;
}

/** Places au même format que les autres listes Listar (recent_posts, place/list). */
function sab_popular_places($limit)
{
    $ids = sab_popular_place_ids($limit);
    if (!$ids) {
        return [];
    }
    $posts = get_posts([
        'post_type'      => 'listar',
        'post_status'    => 'publish',
        'post__in'       => $ids,
        'orderby'        => 'post__in',
        'posts_per_page' => count($ids),
    ]);
    $model = '\\ListarWP\\Plugin\\Models\\Place_Model';
    if (class_exists($model)) {
        foreach ($posts as &$post) {
            $model::assign_data_list($post);
        }
        unset($post);
    }
    return $posts;
}
