const vscode = require('vscode');
const { MCPServer } = require('./server');

let mcpServer;
let statusBarItem;

async function activate(context) {
    console.log('LiveCode AI activated!');

    // Create status bar
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 100
    );
    statusBarItem.command = 'livecode-ai.toggleServer';
    statusBarItem.text = '$(server) MCP: Starting...';
    statusBarItem.show();

    try {
        // Start MCP Server
        mcpServer = new MCPServer(3000);
        await mcpServer.start();

        statusBarItem.text = '$(server) MCP Server: 3000';
        vscode.window.showInformationMessage(
            '✅ MCP Server running at http://localhost:3000/mcp'
        );
    } catch (err) {
        statusBarItem.text = '$(server) MCP Server: Error';
        vscode.window.showErrorMessage(`MCP Server failed: ${err.message}`);
    }

    // Toggle command
    const toggleCmd = vscode.commands.registerCommand(
        'livecode-ai.toggleServer',
        async () => {
            if (mcpServer && mcpServer.isRunning()) {
                await mcpServer.stop();
                statusBarItem.text = '$(server) MCP Server: Off';
                vscode.window.showInformationMessage('MCP Server stopped!');
            } else {
                mcpServer = new MCPServer(3000);
                await mcpServer.start();
                statusBarItem.text = '$(server) MCP Server: 3000';
                vscode.window.showInformationMessage(
                    '✅ MCP Server running at http://localhost:3000/mcp'
                );
            }
        }
    );

    context.subscriptions.push(statusBarItem, toggleCmd);
}

async function deactivate() {
    if (mcpServer) {
        await mcpServer.stop();
    }
}

module.exports = { activate, deactivate };