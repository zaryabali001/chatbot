<?php
/**
 * Plugin Name: MediCare Hospital Chatbot
 * Plugin URI: https://yourvercelapp.vercel.app
 * Description: Premium AI-powered hospital chatbot for patient assistance
 * Version: 1.0.0
 * Author: MediCare
 * Author URI: https://yourvercelapp.vercel.app
 * License: GPL v2 or later
 * Text Domain: medicare-chatbot
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MEDICARE_CHATBOT_VERSION', '1.0.0');
define('MEDICARE_CHATBOT_PATH', plugin_dir_path(__FILE__));
define('MEDICARE_CHATBOT_URL', plugin_dir_url(__FILE__));

class MediCareChatbot {
    
    private static $instance = null;
    
    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new MediCareChatbot();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Add admin menu
        add_action('admin_menu', array($this, 'addAdminMenu'));
        
        // Register settings
        add_action('admin_init', array($this, 'registerSettings'));
        
        // Add chatbot to frontend
        add_action('wp_footer', array($this, 'addChatbotToFrontend'));
        
        // Add admin styles
        add_action('admin_enqueue_scripts', array($this, 'enqueueAdminStyles'));
    }
    
    public function addAdminMenu() {
        add_menu_page(
            'MediCare Chatbot',
            'MediCare Chatbot',
            'manage_options',
            'medicare-chatbot',
            array($this, 'renderAdminPage'),
            'dashicons-format-chat',
            30
        );
    }
    
    public function registerSettings() {
        register_setting('medicare_chatbot_settings', 'medicare_chatbot_unique_id');
        register_setting('medicare_chatbot_settings', 'medicare_chatbot_vercel_url');
        register_setting('medicare_chatbot_settings', 'medicare_chatbot_enabled');
    }
    
    public function enqueueAdminStyles($hook) {
        if ($hook != 'toplevel_page_medicare-chatbot') {
            return;
        }
        
        wp_enqueue_style(
            'medicare-chatbot-admin',
            MEDICARE_CHATBOT_URL . 'assets/admin-style.css',
            array(),
            MEDICARE_CHATBOT_VERSION
        );
    }
    
    public function renderAdminPage() {
        $unique_id = get_option('medicare_chatbot_unique_id', '');
        $vercel_url = get_option('medicare_chatbot_vercel_url', 'https://yourapp.vercel.app');
        $enabled = get_option('medicare_chatbot_enabled', '1');
        
        // Generate unique ID if not exists
        if (empty($unique_id)) {
            $unique_id = 'mc_' . wp_generate_password(16, false);
            update_option('medicare_chatbot_unique_id', $unique_id);
        }
        
        ?>
        <div class="wrap medicare-chatbot-admin">
            <h1>
                <span class="dashicons dashicons-format-chat" style="color: #10b981;"></span>
                MediCare Hospital Chatbot Settings
            </h1>
            
            <div class="medicare-card">
                <form method="post" action="options.php">
                    <?php settings_fields('medicare_chatbot_settings'); ?>
                    
                    <div class="medicare-section">
                        <h2>🔑 Integration Settings</h2>
                        
                        <table class="form-table">
                            <tr>
                                <th scope="row">
                                    <label for="medicare_chatbot_enabled">Enable Chatbot</label>
                                </th>
                                <td>
                                    <label class="medicare-toggle">
                                        <input type="checkbox" 
                                               id="medicare_chatbot_enabled" 
                                               name="medicare_chatbot_enabled" 
                                               value="1" 
                                               <?php checked($enabled, '1'); ?>>
                                        <span class="medicare-toggle-slider"></span>
                                    </label>
                                    <p class="description">Show chatbot on your website</p>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="medicare_chatbot_unique_id">Unique ID</label>
                                </th>
                                <td>
                                    <input type="text" 
                                           id="medicare_chatbot_unique_id" 
                                           name="medicare_chatbot_unique_id" 
                                           value="<?php echo esc_attr($unique_id); ?>" 
                                           class="regular-text medicare-input" 
                                           readonly>
                                    <p class="description">
                                        This is your unique identifier. Keep it secure.
                                    </p>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="medicare_chatbot_vercel_url">Vercel App URL</label>
                                </th>
                                <td>
                                    <input type="url" 
                                           id="medicare_chatbot_vercel_url" 
                                           name="medicare_chatbot_vercel_url" 
                                           value="<?php echo esc_url($vercel_url); ?>" 
                                           class="regular-text medicare-input" 
                                           placeholder="https://yourapp.vercel.app">
                                    <p class="description">
                                        Enter your Vercel deployment URL (without trailing slash)
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="medicare-section">
                        <h2>📋 Embed Code</h2>
                        <p>Use this iframe code to embed the chatbot anywhere:</p>
                        <textarea readonly class="medicare-code" rows="4"><?php 
                            echo esc_html('<iframe src="' . esc_url($vercel_url) . '/embed?id=' . esc_attr($unique_id) . '" style="position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;pointer-events:none;" id="medicare-chatbot-frame"></iframe>
<script>
document.getElementById("medicare-chatbot-frame").contentWindow.postMessage({action: "enablePointerEvents"}, "*");
</script>');
                        ?></textarea>
                    </div>
                    
                    <div class="medicare-section">
                        <h2>✅ Status</h2>
                        <div class="medicare-status-card">
                            <div class="medicare-status-item">
                                <span class="medicare-status-icon">🟢</span>
                                <div>
                                    <strong>Chatbot Status</strong>
                                    <p><?php echo $enabled == '1' ? 'Active' : 'Disabled'; ?></p>
                                </div>
                            </div>
                            <div class="medicare-status-item">
                                <span class="medicare-status-icon">🔑</span>
                                <div>
                                    <strong>Unique ID</strong>
                                    <p><?php echo esc_html($unique_id); ?></p>
                                </div>
                            </div>
                            <div class="medicare-status-item">
                                <span class="medicare-status-icon">🌐</span>
                                <div>
                                    <strong>Integration URL</strong>
                                    <p><?php echo esc_url($vercel_url); ?>/embed?id=<?php echo esc_attr($unique_id); ?></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <?php submit_button('Save Settings', 'primary medicare-button'); ?>
                </form>
            </div>
            
            <div class="medicare-card">
                <h2>🚀 Quick Setup Guide</h2>
                <ol class="medicare-setup-steps">
                    <li>Deploy the chatbot to Vercel from the provided repository</li>
                    <li>Copy your Vercel deployment URL</li>
                    <li>Paste the URL in the "Vercel App URL" field above</li>
                    <li>Your unique ID is automatically generated</li>
                    <li>Enable the chatbot and save settings</li>
                    <li>The chatbot will appear on all pages of your website</li>
                </ol>
            </div>
        </div>
        <?php
    }
    
    public function addChatbotToFrontend() {
        $enabled = get_option('medicare_chatbot_enabled', '1');
        if ($enabled != '1') {
            return;
        }
        
        $unique_id = get_option('medicare_chatbot_unique_id', '');
        $vercel_url = get_option('medicare_chatbot_vercel_url', 'https://yourapp.vercel.app');
        
        if (empty($unique_id)) {
            return;
        }
        
        $embed_url = esc_url($vercel_url . '/embed?id=' . $unique_id);
        
        ?>
        <iframe 
            src="<?php echo $embed_url; ?>" 
            style="position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:999999;pointer-events:none;" 
            id="medicare-chatbot-frame"
            title="MediCare Hospital Chatbot">
        </iframe>
        <script>
            (function() {
                var frame = document.getElementById('medicare-chatbot-frame');
                if (frame) {
                    // Allow clicks on chatbot only
                    frame.addEventListener('load', function() {
                        frame.style.pointerEvents = 'auto';
                    });
                }
            })();
        </script>
        <?php
    }
}

// Initialize plugin
MediCareChatbot::getInstance();
