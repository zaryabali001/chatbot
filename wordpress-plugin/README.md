# MediCare Hospital Chatbot - WordPress Plugin

A premium AI-powered hospital chatbot plugin that integrates seamlessly with your WordPress website.

## Features

- Premium green medical-grade UI design
- Glassmorphism floating icon with pulse animation
- Smart popup queries for quick actions
- Full chat interface with reply functionality
- Unique ID integration for secure embedding
- Easy WordPress admin configuration
- Responsive design for all devices

## Installation

### Step 1: Deploy Chatbot to Vercel

1. Push your Next.js chatbot code to GitHub
2. Import the repository to Vercel
3. Deploy the application
4. Copy your Vercel deployment URL (e.g., `https://yourapp.vercel.app`)

### Step 2: Install WordPress Plugin

1. Download the `medicare-chatbot` folder
2. Upload it to `/wp-content/plugins/` directory
3. Activate the plugin from WordPress admin panel
4. Go to **MediCare Chatbot** in the admin menu

### Step 3: Configure Settings

1. Paste your Vercel deployment URL in the settings
2. Your unique ID is automatically generated
3. Enable the chatbot
4. Save settings

## Configuration

The plugin admin panel provides:

- **Enable/Disable Toggle**: Control chatbot visibility
- **Unique ID**: Automatically generated secure identifier
- **Vercel URL**: Your chatbot deployment URL
- **Embed Code**: For manual integration if needed
- **Status Dashboard**: Real-time integration status

## How It Works

1. WordPress plugin generates a unique ID for your site
2. The chatbot is embedded via iframe with the unique ID
3. All messages are tagged with the unique ID for backend processing
4. The chatbot appears on all pages automatically

## Reply Functionality

When users click "Reply" on an AI message:
- The original message context is stored
- Reply preview appears above the input
- Next message includes reply context
- Reply context is sent to backend for processing

## Security

- Unique ID is generated securely using WordPress functions
- All URLs are properly escaped and validated
- CSRF protection via WordPress nonces
- Iframe sandboxing for security

## Support

For issues or questions, contact support@medicare.com

## Version

1.0.0 - Initial Release
