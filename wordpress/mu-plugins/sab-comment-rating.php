<?php
/**
 * Plugin Name: Sortir à Bangui – Note des commentaires en attente
 * Description: Conserve la note (étoiles) d'un commentaire mis en attente de modération.
 * Version:     1.0.0
 *
 * Pourquoi : Listar (Comment_Model::after_save_comment, sur wp_insert_comment) n'enregistre la
 * méta « rating » d'un commentaire QUE s'il est déjà approuvé. Avec la modération activée
 * (option comment_moderation), tout nouveau commentaire est en attente : sa note était donc
 * perdue définitivement, et l'approbation ultérieure ne la retrouvait pas.
 *
 * Ici, on enregistre la note des commentaires NON approuvés. À l'approbation, Listar
 * (after_set_comment_status → set_rating_meta) recalcule la moyenne à partir de cette méta.
 * Les commentaires déjà approuvés restent gérés par Listar (pas de doublon).
 *
 * Installation : copier ce fichier dans wp-content/mu-plugins/. Rien à activer.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_insert_comment', function ($comment_id, $comment) {
    if ($comment->comment_approved === '1' || (int) $comment->comment_parent !== 0) {
        return; // approuvé : Listar s'en charge ; réponse : pas de note.
    }
    if (get_post_type($comment->comment_post_ID) !== 'listar') {
        return;
    }
    // L'app envoie un formulaire multipart (post, rating, content) à wp/v2/comments.
    $rating = isset($_POST['rating']) ? absint($_POST['rating']) : 0;
    if ($rating < 1 || $rating > 5) {
        return;
    }
    update_comment_meta($comment_id, 'rating', $rating);
}, 20, 2);
