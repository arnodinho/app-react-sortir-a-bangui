<?php
/**
 * Plugin Name: Sortir à Bangui – Agenda (événements)
 * Description: Type de contenu « sab_event » + API REST sab/v1/events utilisée par l'onglet
 *              Agenda de l'application mobile (liste, détail, proposition d'un événement).
 * Version:     0.2.1
 *
 * Installation : copier ce fichier dans wp-content/mu-plugins/ (chargé automatiquement).
 *
 * Indépendant du plugin Listar : les événements ne sont pas des « places ». Un événement
 * proposé depuis l'app est publié immédiatement (pas de validation) ; l'admin reçoit un
 * e-mail et peut le dépublier/supprimer depuis wp-admin (menu « Agenda »).
 *
 * Dates : stockées en heure locale du site (Réglages > Général > fuseau horaire, Bangui =
 * UTC+1) au format « Y-m-d H:i:s », ce qui permet le tri/filtre en DATETIME.
 */

if (!defined('ABSPATH')) {
    exit;
}

const SAB_EVENT_POST_TYPE = 'sab_event';

/** Nombre max d'événements qu'un utilisateur peut proposer par 24 h (anti-abus). */
const SAB_EVENT_MAX_PER_DAY = 5;

/** Nombre max de photos dans la galerie. */
const SAB_EVENT_MAX_PHOTOS = 8;

/** Métadonnées d'un événement : clé => type de nettoyage. */
function sab_event_meta_fields()
{
    return [
        'sab_event_start'     => 'datetime', // obligatoire
        'sab_event_end'       => 'datetime', // optionnel
        'sab_event_venue'     => 'text',     // nom du lieu (« Alliance française »)
        'sab_event_address'   => 'text',
        'sab_event_latitude'  => 'float',
        'sab_event_longitude' => 'float',
        'sab_event_price'     => 'text',     // texte libre : « Gratuit », « 5 000 XAF »…
        'sab_event_phone'     => 'text',
        'sab_event_website'   => 'url',
        'sab_event_gallery'   => 'ids',      // ids d'attachements, séparés par des virgules
        'sab_event_place_id'  => 'int',      // optionnel : place Listar associée
    ];
}

/* -------------------------------------------------------------------------
 * Type de contenu + écran d'édition wp-admin
 * ---------------------------------------------------------------------- */

add_action('init', function () {
    register_post_type(SAB_EVENT_POST_TYPE, [
        'labels'       => [
            'name'          => 'Agenda',
            'singular_name' => 'Événement',
            'add_new_item'  => 'Ajouter un événement',
            'edit_item'     => "Modifier l'événement",
            'all_items'     => 'Tous les événements',
            'menu_name'     => 'Agenda',
        ],
        'public'       => true,
        'has_archive'  => false,
        'rewrite'      => ['slug' => 'agenda'],
        'menu_icon'    => 'dashicons-calendar-alt',
        'supports'     => ['title', 'editor', 'thumbnail', 'author', 'excerpt'],
        // Pas d'exposition wp/v2 : l'app passe uniquement par sab/v1/events.
        'show_in_rest' => false,
    ]);
});

add_action('add_meta_boxes', function () {
    add_meta_box('sab_event_details', "Détails de l'événement", 'sab_event_render_metabox',
        SAB_EVENT_POST_TYPE, 'normal', 'high');
});

function sab_event_render_metabox(WP_Post $post)
{
    wp_nonce_field('sab_event_save', 'sab_event_nonce');
    $labels = [
        'sab_event_start'     => 'Début *',
        'sab_event_end'       => 'Fin',
        'sab_event_venue'     => 'Lieu',
        'sab_event_address'   => 'Adresse',
        'sab_event_latitude'  => 'Latitude',
        'sab_event_longitude' => 'Longitude',
        'sab_event_price'     => 'Prix',
        'sab_event_phone'     => 'Téléphone',
        'sab_event_website'   => 'Site web / billetterie',
        'sab_event_gallery'   => 'Galerie (ids des médias, séparés par des virgules)',
        'sab_event_place_id'  => 'Place associée (id Listar)',
    ];
    echo '<table class="form-table">';
    foreach ($labels as $key => $label) {
        $value = get_post_meta($post->ID, $key, true);
        $type = 'text';
        if (in_array($key, ['sab_event_start', 'sab_event_end'], true)) {
            // Sélecteur date + heure natif du navigateur ; il envoie « AAAA-MM-JJTHH:MM »,
            // que sab_event_parse_datetime() accepte déjà.
            $type  = 'datetime-local';
            $value = $value ? str_replace(' ', 'T', substr($value, 0, 16)) : '';
        }
        printf(
            '<tr><th><label for="%1$s">%2$s</label></th><td><input type="%4$s" class="regular-text" id="%1$s" name="%1$s" value="%3$s"%5$s></td></tr>',
            esc_attr($key), esc_html($label), esc_attr($value), esc_attr($type),
            $key === 'sab_event_start' ? ' required' : ''
        );
    }
    echo '</table>';
}

add_action('save_post_' . SAB_EVENT_POST_TYPE, function ($post_id) {
    if (!isset($_POST['sab_event_nonce']) || !wp_verify_nonce($_POST['sab_event_nonce'], 'sab_event_save')) {
        return;
    }
    if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || !current_user_can('edit_post', $post_id)) {
        return;
    }
    foreach (sab_event_meta_fields() as $key => $type) {
        if (array_key_exists($key, $_POST)) {
            sab_event_update_meta($post_id, $key, $type, wp_unslash($_POST[$key]));
        }
    }
});

// Colonne « Date de l'événement » dans la liste wp-admin.
add_filter('manage_' . SAB_EVENT_POST_TYPE . '_posts_columns', function ($columns) {
    $columns['sab_event_start'] = "Date de l'événement";
    return $columns;
});
add_action('manage_' . SAB_EVENT_POST_TYPE . '_posts_custom_column', function ($column, $post_id) {
    if ($column === 'sab_event_start') {
        echo esc_html(substr((string) get_post_meta($post_id, 'sab_event_start', true), 0, 16));
    }
}, 10, 2);

/* -------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------- */

/** Normalise une date « Y-m-d H:i[:s] » (ou ISO sans fuseau) en « Y-m-d H:i:s », sinon null. */
function sab_event_parse_datetime($value)
{
    $value = trim(str_replace('T', ' ', (string) $value));
    if ($value === '') {
        return null;
    }
    foreach (['Y-m-d H:i:s', 'Y-m-d H:i', 'Y-m-d'] as $format) {
        $date = DateTime::createFromFormat('!' . $format, $value, wp_timezone());
        if ($date && $date->format($format) === $value) {
            return $date->format('Y-m-d H:i:s');
        }
    }
    return null;
}

function sab_event_update_meta($post_id, $key, $type, $raw)
{
    $raw = is_string($raw) ? trim($raw) : $raw;
    if ($raw === '' || $raw === null) {
        delete_post_meta($post_id, $key);
        return;
    }
    switch ($type) {
        case 'datetime':
            $value = sab_event_parse_datetime($raw);
            break;
        case 'float':
            $value = is_numeric($raw) ? (float) $raw : null;
            break;
        case 'int':
            $value = absint($raw) ?: null;
            break;
        case 'url':
            $value = esc_url_raw($raw) ?: null;
            break;
        case 'ids':
            $ids   = array_filter(array_map('absint', explode(',', (string) $raw)));
            $value = $ids ? implode(',', array_slice(array_unique($ids), 0, SAB_EVENT_MAX_PHOTOS)) : null;
            break;
        default:
            $value = sanitize_text_field($raw);
    }
    if ($value === null) {
        delete_post_meta($post_id, $key);
    } else {
        update_post_meta($post_id, $key, $value);
    }
}

/** Même format d'image que l'API Listar ({full: {url}, thumb: {url}}) => ImageModel côté app. */
function sab_event_image($attachment_id)
{
    $full  = wp_get_attachment_image_src($attachment_id, 'full');
    $thumb = wp_get_attachment_image_src($attachment_id, 'medium');
    if (!$full) {
        return null;
    }
    return [
        'id'    => (int) $attachment_id,
        'full'  => ['url' => $full[0]],
        'thumb' => ['url' => $thumb ? $thumb[0] : $full[0]],
    ];
}

function sab_event_to_array(WP_Post $post, $detail = false)
{
    $meta = function ($key) use ($post) {
        $value = get_post_meta($post->ID, $key, true);
        return $value === '' ? null : $value;
    };

    $gallery_ids = array_filter(array_map('absint', explode(',', (string) $meta('sab_event_gallery'))));
    $thumbnail   = get_post_thumbnail_id($post) ?: ($gallery_ids ? reset($gallery_ids) : 0);

    $data = [
        'ID'         => $post->ID,
        'post_title' => get_the_title($post),
        'excerpt'    => wp_trim_words(wp_strip_all_tags($post->post_excerpt ?: $post->post_content), 30),
        'status'     => $post->post_status,
        'start'      => $meta('sab_event_start'),
        'end'        => $meta('sab_event_end'),
        'venue'      => $meta('sab_event_venue'),
        'address'    => $meta('sab_event_address'),
        'latitude'   => $meta('sab_event_latitude') !== null ? (float) $meta('sab_event_latitude') : null,
        'longitude'  => $meta('sab_event_longitude') !== null ? (float) $meta('sab_event_longitude') : null,
        'price'      => $meta('sab_event_price'),
        'image'      => $thumbnail ? sab_event_image($thumbnail) : null,
        'link'       => get_permalink($post),
    ];

    if ($detail) {
        $data['content'] = wp_strip_all_tags($post->post_content);
        $data['phone']   = $meta('sab_event_phone');
        $data['website'] = $meta('sab_event_website');
        $data['place_id'] = $meta('sab_event_place_id') ? (int) $meta('sab_event_place_id') : null;
        $data['galleries'] = array_values(array_filter(array_map('sab_event_image', $gallery_ids)));
        $author = get_userdata($post->post_author);
        $data['author'] = $author ? ['id' => $author->ID, 'name' => $author->display_name] : null;
    }

    return $data;
}

/* -------------------------------------------------------------------------
 * API REST
 * ---------------------------------------------------------------------- */

add_action('rest_api_init', function () {
    register_rest_route('sab/v1', '/events', [
        [
            'methods'             => 'GET',
            'callback'            => 'sab_event_rest_list',
            'permission_callback' => '__return_true',
            'args'                => [
                'page'     => ['type' => 'integer', 'default' => 1, 'minimum' => 1],
                'per_page' => ['type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 50],
                // upcoming : en cours ou à venir (tri chronologique) ; past : terminés (récent d'abord).
                'scope'    => ['type' => 'string', 'default' => 'upcoming', 'enum' => ['upcoming', 'past']],
                's'        => ['type' => 'string', 'required' => false],
            ],
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'sab_event_rest_create',
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ],
    ]);

    register_rest_route('sab/v1', '/events/(?P<id>\d+)', [
        'methods'             => 'GET',
        'callback'            => 'sab_event_rest_view',
        'permission_callback' => '__return_true',
    ]);
});

function sab_event_rest_list(WP_REST_Request $request)
{
    $now      = current_time('mysql'); // heure locale du site
    $upcoming = $request['scope'] !== 'past';

    $args = [
        'post_type'      => SAB_EVENT_POST_TYPE,
        'post_status'    => 'publish',
        'paged'          => (int) $request['page'],
        'posts_per_page' => (int) $request['per_page'],
        'meta_key'       => 'sab_event_start',
        'meta_type'      => 'DATETIME',
        'orderby'        => 'meta_value',
        'order'          => $upcoming ? 'ASC' : 'DESC',
        'meta_query'     => $upcoming
            ? [
                'relation' => 'OR',
                ['key' => 'sab_event_end', 'value' => $now, 'compare' => '>=', 'type' => 'DATETIME'],
                [
                    'relation' => 'AND',
                    ['key' => 'sab_event_end', 'compare' => 'NOT EXISTS'],
                    // Sans heure de fin : visible jusqu'à la fin de la journée.
                    ['key' => 'sab_event_start', 'value' => substr($now, 0, 10) . ' 00:00:00', 'compare' => '>=', 'type' => 'DATETIME'],
                ],
            ]
            : [
                'relation' => 'OR',
                ['key' => 'sab_event_end', 'value' => $now, 'compare' => '<', 'type' => 'DATETIME'],
                [
                    'relation' => 'AND',
                    ['key' => 'sab_event_end', 'compare' => 'NOT EXISTS'],
                    ['key' => 'sab_event_start', 'value' => substr($now, 0, 10) . ' 00:00:00', 'compare' => '<', 'type' => 'DATETIME'],
                ],
            ],
    ];
    if (!empty($request['s'])) {
        $args['s'] = sanitize_text_field($request['s']);
    }

    $query = new WP_Query($args);

    return [
        'success'    => true,
        'data'       => array_map(function ($post) {
            return sab_event_to_array($post);
        }, $query->posts),
        'pagination' => [
            'page'     => (int) $request['page'],
            'per_page' => (int) $request['per_page'],
            'max_page' => (int) $query->max_num_pages,
            'total'    => (int) $query->found_posts,
        ],
    ];
}

function sab_event_rest_view(WP_REST_Request $request)
{
    $post = get_post((int) $request['id']);
    $visible = $post && $post->post_type === SAB_EVENT_POST_TYPE
        && ($post->post_status === 'publish'
            // L'auteur peut voir son événement en attente de validation.
            || (is_user_logged_in() && (int) $post->post_author === get_current_user_id()));
    if (!$visible) {
        return new WP_Error('sab_event_not_found', 'Événement introuvable.', ['status' => 404]);
    }
    return ['success' => true, 'data' => sab_event_to_array($post, true)];
}

/**
 * Proposer un événement. Corps JSON ou form-encoded :
 * title*, content*, start* (Y-m-d H:i), end, venue*, address, latitude, longitude,
 * price, phone, website, gallery (ids d'attachements wp/v2/media, séparés par des virgules).
 * Publié immédiatement (pas de modération a priori).
 */
function sab_event_rest_create(WP_REST_Request $request)
{
    $user_id = get_current_user_id();

    $recent = get_posts([
        'post_type'      => SAB_EVENT_POST_TYPE,
        'post_status'    => 'any',
        'author'         => $user_id,
        'date_query'     => [['after' => '24 hours ago']],
        'fields'         => 'ids',
        'posts_per_page' => SAB_EVENT_MAX_PER_DAY,
    ]);
    if (count($recent) >= SAB_EVENT_MAX_PER_DAY) {
        return new WP_Error('sab_event_rate_limit',
            "Vous avez proposé trop d'événements aujourd'hui. Réessayez demain.", ['status' => 429]);
    }

    $title   = sanitize_text_field((string) $request['title']);
    $content = sanitize_textarea_field((string) $request['content']);
    $venue   = sanitize_text_field((string) $request['venue']);
    $start   = sab_event_parse_datetime($request['start']);
    $end     = sab_event_parse_datetime($request['end']);

    if ($title === '' || $content === '' || $venue === '' || !$start) {
        return new WP_Error('sab_event_missing',
            'Le titre, la description, le lieu et la date de début sont obligatoires.', ['status' => 400]);
    }
    if ($end && $end < $start) {
        return new WP_Error('sab_event_dates', 'La date de fin doit être après la date de début.', ['status' => 400]);
    }

    // Ne garder que des médias appartenant à l'utilisateur.
    $gallery = array_values(array_filter(
        array_map('absint', explode(',', (string) $request['gallery'])),
        function ($id) use ($user_id) {
            $attachment = get_post($id);
            return $attachment && $attachment->post_type === 'attachment'
                && (int) $attachment->post_author === $user_id;
        }
    ));

    $post_id = wp_insert_post([
        'post_type'    => SAB_EVENT_POST_TYPE,
        'post_status'  => 'publish',
        'post_title'   => $title,
        'post_content' => $content,
        'post_author'  => $user_id,
    ], true);
    if (is_wp_error($post_id)) {
        return $post_id;
    }

    $values = [
        'sab_event_start'     => $start,
        'sab_event_end'       => $end,
        'sab_event_venue'     => $venue,
        'sab_event_address'   => $request['address'],
        'sab_event_latitude'  => $request['latitude'],
        'sab_event_longitude' => $request['longitude'],
        'sab_event_price'     => $request['price'],
        'sab_event_phone'     => $request['phone'],
        'sab_event_website'   => $request['website'],
        'sab_event_gallery'   => implode(',', $gallery),
    ];
    $types = sab_event_meta_fields();
    foreach ($values as $key => $value) {
        sab_event_update_meta($post_id, $key, $types[$key], $value);
    }

    if ($gallery) {
        set_post_thumbnail($post_id, $gallery[0]);
        foreach ($gallery as $attachment_id) {
            wp_update_post(['ID' => $attachment_id, 'post_parent' => $post_id]);
        }
    }

    // Publié sans validation : prévenir l'admin pour qu'il puisse le retirer si besoin.
    wp_mail(
        get_option('admin_email'),
        '[Sortir à Bangui] Nouvel événement publié : ' . $title,
        "Un événement vient d'être publié depuis l'application :\n\n{$title}\n{$start} — {$venue}\n\n"
        . admin_url('post.php?post=' . $post_id . '&action=edit')
    );

    return ['success' => true, 'post_id' => $post_id, 'status' => 'publish'];
}
