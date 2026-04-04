<?php
/**
 * Plugin Name: GoElev8.ai Site Connect
 * Description: Connect your WordPress site to your GoElev8.ai AI lead capture system.
 * Version: 1.0.0
 * Author: GoElev8.ai
 * Author URI: https://goelev8.ai
 * License: GPL2
 * (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
 */

if (!defined('ABSPATH')) exit;

// Add settings page
add_action('admin_menu', function() {
    add_options_page('GoElev8.ai', 'GoElev8.ai', 'manage_options', 'goelev8', 'ge8_settings_page');
});

function ge8_settings_page() {
    if (isset($_POST['ge8_slug']) && check_admin_referer('ge8_save_settings')) {
        update_option('ge8_funnel_slug', sanitize_text_field($_POST['ge8_slug']));
        echo '<div class="notice notice-success"><p>Saved! GoElev8.ai is now active on your site.</p></div>';
    }
    $slug = get_option('ge8_funnel_slug', '');
    ?>
    <div class="wrap">
        <h1>GoElev8.ai Site Connect</h1>
        <p>Enter your GoElev8.ai funnel slug to activate lead capture on your site.</p>
        <form method="post">
            <?php wp_nonce_field('ge8_save_settings'); ?>
            <table class="form-table">
                <tr>
                    <th><label for="ge8_slug">Funnel Slug</label></th>
                    <td>
                        <input type="text" id="ge8_slug" name="ge8_slug"
                               value="<?php echo esc_attr($slug); ?>"
                               placeholder="your-business-name" class="regular-text">
                        <p class="description">Found at goelev8.ai/f/<strong>your-slug</strong></p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Save & Activate'); ?>
        </form>
        <?php if ($slug): ?>
        <div style="background:#e8f5e9;padding:15px;border-radius:4px;margin-top:20px">
            <strong>Active:</strong> GoElev8.ai lead capture is running on your site.
            <br>Funnel: <a href="https://goelev8.ai/f/<?php echo esc_attr($slug); ?>" target="_blank">goelev8.ai/f/<?php echo esc_attr($slug); ?></a>
        </div>
        <?php endif; ?>
    </div>
    <?php
}

// Inject widget script in footer
add_action('wp_footer', function() {
    $slug = get_option('ge8_funnel_slug', '');
    if (!$slug) return;
    echo '<script src="https://goelev8.ai/widget.js" data-funnel="' . esc_attr($slug) . '" defer></script>' . "\n";
});
