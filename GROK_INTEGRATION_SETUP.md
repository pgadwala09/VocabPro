# Grok AI Integration Setup for JAM Sessions

This document explains how to set up Grok AI integration for content generation in the JAM Sessions feature.

## Overview

The JAM Sessions Create Content feature now supports multiple AI services:
- **OpenAI**: Structured, educational content with clear sections
- **Grok**: Comprehensive content with real-time knowledge
- **Grok Creative**: Fun, engaging content with storytelling

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# OpenAI (existing)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_PROXY=your_openai_proxy_url_here  # optional

# Grok AI (new)
VITE_GROK_API_KEY=your_grok_api_key_here
VITE_GROK_PROXY=your_grok_proxy_url_here  # optional
```

### 2. Grok API Access

**Note**: Grok API is currently in limited access. You may need to:
1. Join the Grok waitlist at https://x.ai/
2. Apply for API access
3. Get your API key from the Grok dashboard

### 3. API Configuration

The Grok integration is configured to use:
- **Model**: `grok-beta`
- **Base URL**: `https://api.x.ai/v1/chat/completions`
- **Authentication**: `X-API-Key` header (or `Authorization: Bearer` for proxy)
- **Temperature**: 0.7-0.8 (for creative variation)
- **Max Tokens**: 1800-2000 (for comprehensive content)
- **Stream**: false (for complete responses)

## Features

### OpenAI Content Generation
- **Button**: "Generate with OpenAI" (Blue)
- **Style**: Structured, educational content
- **Best for**: Formal learning materials, clear explanations
- **Sections**: Introduction, Beginner, Middle, Conclusion

### Grok Content Generation
- **Button**: "Generate with Grok" (Orange)
- **Style**: Comprehensive content with real-time knowledge
- **Best for**: Current topics, detailed explanations
- **Features**: Real-time information, comprehensive coverage

### Grok Creative Content Generation
- **Button**: "Generate Creative with Grok" (Pink)
- **Style**: Fun, engaging content with storytelling
- **Best for**: Engaging learners, making topics interesting
- **Features**: Storytelling, analogies, interactive elements

## Usage

1. **Navigate to JAM Sessions** in your VocabPro application
2. **Click on "Create Content"** tab
3. **Fill in the form**:
   - Summary: Your topic
   - Age Group: Primary/Secondary/Higher secondary
   - Proficiency Level: Beginner/Intermediate/Advanced
4. **Choose your AI service**:
   - Click "Search the Web" for web-based content
   - Click "Generate with OpenAI" for structured content
   - Click "Generate with Grok" for comprehensive content
   - Click "Generate Creative with Grok" for fun content
5. **View generated content** in the Content Notes section
6. **Save notes** or download content

## Content Display

Generated content includes:
- **Status badge**: Shows which AI service was used
- **Bionic Reading**: Enhanced text display for better reading
- **Download options**: Save as text file
- **Sharing options**: WhatsApp, Email

## Troubleshooting

### Grok API Not Available
If Grok API is not configured:
- Only OpenAI and web search options will be available
- Grok buttons will be hidden automatically
- No error messages will be shown

### API Errors
- Check your API keys in the environment variables
- Ensure you have proper API access
- Check network connectivity
- Review console logs for detailed error messages
- Test API connection using the browser console: `await testGrokConnection()`

### Content Generation Issues
- Ensure you have filled in the topic summary
- Select appropriate age group and proficiency level
- Check that your API keys have sufficient credits/quota

## Technical Details

### Files Modified
- `src/lib/grok.ts` - New Grok AI integration
- `src/components/JamSessions.tsx` - Updated UI and functionality

### Key Functions
- `generateGrokContent()` - Standard content generation
- `generateGrokCreativeContent()` - Creative content generation
- `isGrokAvailable()` - Check if Grok is configured

### Error Handling
- Graceful fallbacks when APIs are unavailable
- Loading states for better user experience
- Console logging for debugging

## Future Enhancements

Potential improvements:
- Content comparison between AI services
- Custom prompts for specific topics
- Content templates for different subjects
- Integration with more AI services
- Content quality scoring
- User feedback collection

## Support

For issues or questions:
1. Check the console logs for error messages
2. Verify your API keys and access
3. Test with different topics and settings
4. Review the troubleshooting section above
