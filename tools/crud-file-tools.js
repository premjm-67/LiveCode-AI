const vscode = require('vscode');

function workspaceRoot() {
    if (!vscode.workspace.workspaceFolders?.length) {
        throw new Error('No workspace folder is open');
    }
    return vscode.workspace.workspaceFolders[0].uri;
}

async function focusWindow() {
    try {
        await vscode.commands.executeCommand(
            'workbench.action.focusActiveEditorGroup'
        );
    } catch { }
}

// ── CREATE ────────────────────────────────────────────────────
async function createFile(filePath, content, overwrite = false) {
    const uri = vscode.Uri.joinPath(workspaceRoot(), filePath);
    const edit = new vscode.WorkspaceEdit();
    edit.createFile(uri, {
        contents: new TextEncoder().encode(content),
        overwrite: overwrite
    });
    const ok = await vscode.workspace.applyEdit(edit);
    if (!ok) throw new Error(`Failed to create: ${filePath}`);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: false });
    await focusWindow();
}

// ── READ ──────────────────────────────────────────────────────
async function readFile(filePath) {
    const uri = vscode.Uri.joinPath(workspaceRoot(), filePath);
    const bytes = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder('utf-8').decode(bytes);
}

// ── UPDATE ────────────────────────────────────────────────────
async function updateFile(filePath, startLine, endLine, newContent, originalCode) {
    const uri = vscode.Uri.joinPath(workspaceRoot(), filePath);
    const doc = await vscode.workspace.openTextDocument(uri);

    const current = Array.from(
        { length: endLine - startLine + 1 },
        (_, i) => doc.lineAt((startLine - 1) + i).text
    ).join('\n');

    if (current !== originalCode) {
        throw new Error('Original code mismatch — re-read file and retry');
    }

    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    await focusWindow();

    const range = new vscode.Range(
        new vscode.Position(startLine - 1, 0),
        new vscode.Position(endLine - 1, doc.lineAt(endLine - 1).text.length)
    );

    const applied = await editor.edit(editBuilder => {
        editBuilder.replace(range, newContent);
    });

    if (!applied) throw new Error(`Failed to update: ${filePath}`);
    await doc.save();
}

// ── DELETE ────────────────────────────────────────────────────
async function deleteFile(filePath, recursive = false) {
    const uri = vscode.Uri.joinPath(workspaceRoot(), filePath);
    await vscode.workspace.fs.delete(uri, {
        recursive,
        useTrash: true
    });
}

module.exports = { createFile, readFile, updateFile, deleteFile };