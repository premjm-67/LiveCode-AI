const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp');
const { z } = require('zod');
const { createFile, readFile, updateFile, deleteFile } = require('./tools/crud-file-tools');
const { typeCharByChar, wpmToMsPerChar } = require('./tools/typing-simulation-tools');
const { explainAndTypeChunks, speakText, stopSpeech } = require('./tools/audio-code-sync-tools');

class MCPServer {
    constructor(port = 3000) {
        this.port = port;
        this.running = false;
        this.httpServer = null;

        this.app = express();
        this.app.use(express.json());

        this.mcpServer = new McpServer({
            name: 'livecode-ai',
            version: '1.0.0'
        }, {
            capabilities: { tools: { listChanged: false } }
        });

        this.transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined
        });

        this.registerTools();
        this.setupRoutes();
    }

    registerTools() {

        // ── CREATE ──────────────────────────────
        this.mcpServer.tool(
            'create_new_file',
            'Creates a new file in VS Code workspace and opens it in editor',
            {
                path: z.string().describe('Relative path from workspace root'),
                content: z.string().describe('Content to write in file'),
                overwrite: z.boolean().optional().default(false)
            },
            async ({ path, content, overwrite = false }) => {
                try {
                    await createFile(path, content, overwrite);
                    return { content: [{ type: 'text', text: `✅ File created: ${path}` }] };
                } catch (err) {
                    return { content: [{ type: 'text', text: `❌ Error: ${err.message}` }] };
                }
            }
        );

        // ── READ ────────────────────────────────
        this.mcpServer.tool(
            'read_file_content',
            'Reads content of a file from VS Code workspace',
            {
                path: z.string().describe('Relative path to the file')
            },
            async ({ path }) => {
                try {
                    const text = await readFile(path);
                    return { content: [{ type: 'text', text }] };
                } catch (err) {
                    return { content: [{ type: 'text', text: `❌ Error: ${err.message}` }] };
                }
            }
        );

        // ── UPDATE ──────────────────────────────
        this.mcpServer.tool(
            'update_file_lines',
            'Updates specific lines in a file with original code validation',
            {
                path: z.string().describe('Relative path to the file'),
                startLine: z.number().describe('Start line 1-based'),
                endLine: z.number().describe('End line 1-based'),
                newContent: z.string().describe('New content to replace'),
                originalCode: z.string().describe('Exact current content for validation')
            },
            async ({ path, startLine, endLine, newContent, originalCode }) => {
                try {
                    await updateFile(path, startLine, endLine, newContent, originalCode);
                    return { content: [{ type: 'text', text: `✅ Updated lines ${startLine}-${endLine} in ${path}` }] };
                } catch (err) {
                    return { content: [{ type: 'text', text: `❌ Error: ${err.message}` }] };
                }
            }
        );

        // ── DELETE ──────────────────────────────
        this.mcpServer.tool(
            'delete_file_or_folder',
            'Deletes a file or folder from VS Code workspace',
            {
                path: z.string().describe('Relative path to file or folder'),
                recursive: z.boolean().optional().default(false)
            },
            async ({ path, recursive = false }) => {
                try {
                    await deleteFile(path, recursive);
                    return { content: [{ type: 'text', text: `🗑️ Deleted: ${path}` }] };
                } catch (err) {
                    return { content: [{ type: 'text', text: `❌ Error: ${err.message}` }] };
                }
            }
        );

        // ── SIMULATE HUMAN TYPING ────────────────
        this.mcpServer.tool(
            'simulate_human_typing',
            `Types code character by character at human speed using VS Code editor API.
            Natural timing variation:
              Newlines     → 2.2x delay
              Spaces       → 0.7x delay  
              Punctuation  → 1.4x delay
              Letters      → random 0.85-1.15x`,
            {
                filepath: z.string().describe('Path to file to type into'),
                code: z.string().describe('Code to type character by character'),
                wpm: z.number().optional().default(40).describe('Typing speed in WPM (40 = 300ms/char)')
            },
            async ({ filepath, code, wpm = 40 }) => {
                try {
                    const msPerChar = wpmToMsPerChar(wpm);
                    await typeCharByChar(filepath, code, msPerChar, false);
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Typing complete!\nFile: ${filepath}\nSpeed: ${wpm} WPM (${msPerChar}ms/char)\nCharacters: ${code.length}`
                        }]
                    };
                } catch (err) {
                    return { content: [{ type: 'text', text: `❌ Error: ${err.message}` }] };
                }
            }
        );

        // ── EXPLAIN AND TYPE CHUNKS ──────────────
        this.mcpServer.tool(
            'explain_and_type_chunks',
            `Bi-modal Audio-Code Synchronization — CHUNK BY CHUNK.
            For each chunk:
              1. speakText(explanation) called → OS takes over speaking
              2. typeCharByChar(code) called → JS types char by char
              3. Both run simultaneously via Promise.all
              4. Promise.all waits for both to finish
              5. Next chunk starts

            Give code in small chunks with explanation for each chunk.
            Example:
            chunks: [
              { code: "import java.util.Scanner;\\n", explanation: "We import Scanner for user input" },
              { code: "public class Main {\\n", explanation: "Now we declare the main class" }
            ]`,
            {
                filepath: z.string().describe('File to type code into'),
                chunks: z.array(z.object({
                    code: z.string().describe('Code lines for this chunk'),
                    explanation: z.string().describe('Explanation spoken while this chunk types')
                })).describe('Array of code and explanation pairs processed one by one'),
                wpm: z.number().optional().default(40).describe('Typing speed in WPM'),
                speechSpeed: z.number().optional().default(1.0).describe('Speech speed 1.0 is normal')
            },
            async ({ filepath, chunks, wpm = 40, speechSpeed = 1.0 }) => {
                try {
                    await explainAndTypeChunks(filepath, chunks, wpm, speechSpeed);
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ All ${chunks.length} chunks complete!\nFile: ${filepath}\nSpeed: ${wpm} WPM`
                        }]
                    };
                } catch (err) {
                    return { content: [{ type: 'text', text: `❌ Error: ${err.message}` }] };
                }
            }
        );

        // ── EXPLAIN WITH VOICE ONLY ──────────────
        this.mcpServer.tool(
            'explain_code_with_voice',
            'Speaks explanation aloud using say module (OS text-to-speech)',
            {
                title: z.string().describe('Title of explanation'),
                explanation: z.string().describe('Text to speak aloud'),
                speed: z.number().optional().default(1.0).describe('Speech speed')
            },
            async ({ title, explanation, speed = 1.0 }) => {
                try {
                    await speakText(`${title}. ${explanation}`, speed);
                    return { content: [{ type: 'text', text: `✅ Explained: ${title}` }] };
                } catch (err) {
                    return { content: [{ type: 'text', text: `❌ Error: ${err.message}` }] };
                }
            }
        );

        // ── STOP VOICE ───────────────────────────
        this.mcpServer.tool(
            'stop_voice_explanation',
            'Stops any currently playing voice explanation immediately',
            {},
            async () => {
                stopSpeech();
                return { content: [{ type: 'text', text: '🔇 Voice stopped.' }] };
            }
        );
    }

    setupRoutes() {
        // Main MCP route
        this.app.post('/mcp', async (req, res) => {
            try {
                await this.transport.handleRequest(req, res, req.body);
            } catch (err) {
                console.error('MCP request error:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: { code: -32603, message: 'Internal server error' },
                        id: req.body?.id || null
                    });
                }
            }
        });

        // SSE route
        this.app.get('/mcp/sse', async (req, res) => {
            try {
                await this.transport.handleRequest(req, res, undefined);
            } catch (err) {
                console.error('SSE error:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: { code: -32603, message: 'Internal server error' },
                        id: null
                    });
                }
            }
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                running: this.running,
                timestamp: new Date().toISOString()
            });
        });

        // Method guards
        this.app.get('/mcp', (req, res) => {
            res.status(405).json({ error: 'Method not allowed' });
        });

        this.app.delete('/mcp', (req, res) => {
            res.status(405).json({ error: 'Method not allowed' });
        });

        // CORS
        this.app.options('/mcp', (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
            res.status(204).end();
        });
    }

    async start() {
        await this.mcpServer.connect(this.transport);
        return new Promise((resolve, reject) => {
            this.httpServer = this.app.listen(this.port, '127.0.0.1', () => {
                this.running = true;
                console.log(`✅ MCP Server running at http://localhost:${this.port}/mcp`);
                resolve();
            });
            this.httpServer.on('error', (err) => {
                console.error('Server error:', err);
                reject(err);
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            if (this.httpServer) {
                this.httpServer.close(() => {
                    this.running = false;
                    console.log('MCP Server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    isRunning() {
        return this.running;
    }
}

module.exports = { MCPServer };