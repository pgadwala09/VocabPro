#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// MCP Server for VocabPro
class VocabProMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'vocabpro-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'send_debate_request',
            description: 'Send a debate request to the AI and get a response',
            inputSchema: {
              type: 'object',
              properties: {
                userId: { type: 'string', description: 'User ID' },
                debateTopic: { type: 'string', description: 'Debate topic' },
                userMessage: { type: 'string', description: 'User message' }
              },
              required: ['userId', 'debateTopic', 'userMessage']
            }
          },
          {
            name: 'fetch_debate_history',
            description: 'Fetch debate history for a user',
            inputSchema: {
              type: 'object',
              properties: {
                userId: { type: 'string', description: 'User ID' },
                topic: { type: 'string', description: 'Optional topic filter' }
              },
              required: ['userId']
            }
          },
          {
            name: 'generate_vocabulary_flashcards',
            description: 'Generate flashcards for vocabulary words',
            inputSchema: {
              type: 'object',
              properties: {
                words: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of words to create flashcards for'
                }
              },
              required: ['words']
            }
          },
          {
            name: 'analyze_pronunciation',
            description: 'Analyze pronunciation from audio data',
            inputSchema: {
              type: 'object',
              properties: {
                audioData: { type: 'string', description: 'Base64 encoded audio data' },
                expectedWord: { type: 'string', description: 'Expected word to pronounce' }
              },
              required: ['audioData', 'expectedWord']
            }
          },
          {
            name: 'search_vocabulary',
            description: 'Search for vocabulary words and definitions',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', description: 'Maximum number of results' }
              },
              required: ['query']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'send_debate_request':
            return await this.handleDebateRequest(args);
          
          case 'fetch_debate_history':
            return await this.handleFetchHistory(args);
          
          case 'generate_vocabulary_flashcards':
            return await this.handleGenerateFlashcards(args);
          
          case 'analyze_pronunciation':
            return await this.handleAnalyzePronunciation(args);
          
          case 'search_vocabulary':
            return await this.handleSearchVocabulary(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async handleDebateRequest(args) {
    const { userId, debateTopic, userMessage } = args;
    
    // Import the debate integration
    const { sendDebateRequest } = await import('./src/lib/debateIntegration.ts');
    
    try {
      const response = await sendDebateRequest(userId, debateTopic, userMessage);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Debate request failed: ${error.message}`);
    }
  }

  async handleFetchHistory(args) {
    const { userId, topic } = args;
    
    // Import the debate integration
    const { fetchDebateHistory } = await import('./src/lib/debateIntegration.ts');
    
    try {
      const history = await fetchDebateHistory(userId, topic);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(history, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
  }

  async handleGenerateFlashcards(args) {
    const { words } = args;
    
    // Generate flashcards for vocabulary words
    const flashcards = words.map(word => ({
      word,
      definition: `Definition for ${word}`,
      example: `Example sentence for ${word}`,
      difficulty: 'medium'
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(flashcards, null, 2)
        }
      ]
    };
  }

  async handleAnalyzePronunciation(args) {
    const { audioData, expectedWord } = args;
    
    // Analyze pronunciation (placeholder implementation)
    const analysis = {
      word: expectedWord,
      accuracy: 0.85,
      feedback: 'Good pronunciation! Try to emphasize the second syllable more.',
      score: 85
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  async handleSearchVocabulary(args) {
    const { query, limit = 10 } = args;
    
    // Search vocabulary (placeholder implementation)
    const results = [
      { word: query, definition: 'Definition found', source: 'dictionary' },
      { word: `${query}ing`, definition: 'Verb form', source: 'dictionary' }
    ].slice(0, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('VocabPro MCP Server running on stdio');
  }
}

// Start the server
const server = new VocabProMCPServer();
server.run().catch(console.error);
