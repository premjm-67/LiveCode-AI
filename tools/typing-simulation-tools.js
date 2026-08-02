const vscode = require('vscode');

// 40 WPM → 40 words/min → 200 chars/min → 300ms/char
function wpmToMsPerChar(wpm) {
    return Math.round(60000 / (wpm * 5));
}

// sleep using setTimeout — stops loop for given ms
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function typeCharByChar(filepath, code, msPerChar, append = false) {

    // Resolve URI
    let uri;
    if (filepath.startsWith('/') || /^[A-Za-z]:/.test(filepath)) {
        uri = vscode.Uri.file(filepath);
    } else {
        if (!vscode.workspace.workspaceFolders?.length) {
            throw new Error('No workspace folder open');
        }
        uri = vscode.Uri.joinPath(
            vscode.workspace.workspaceFolders[0].uri,
            filepath
        );
    }

    // Clear file if not appending
    if (!append) {
        const edit = new vscode.WorkspaceEdit();
        edit.createFile(uri, {
            overwrite: true,
            contents: new TextEncoder().encode('')
        });
        await vscode.workspace.applyEdit(edit);
    }

    // Open file in VS Code editor
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, {
        preview: false,
        preserveFocus: false,
        viewColumn: vscode.ViewColumn.Active
    });

    await vscode.commands.executeCommand(
        'workbench.action.focusActiveEditorGroup'
    );

    // Type each character using VS Code editor API
    for (const char of code) {

        // Get end of document position
        const lastLine = editor.document.lineCount - 1;
        const lastChar = editor.document.lineAt(lastLine).text.length;
        const position = new vscode.Position(lastLine, lastChar);

        // Insert ONE character using VS Code built-in API
        await editor.edit(editBuilder => {
            editBuilder.insert(position, char);
        });

        // Natural human-like delay variation
        let wait;
        if (char === '\n')                        wait = msPerChar * 2.2;
        else if (char === ' ')                    wait = msPerChar * 0.7;
        else if ('.,;:(){}[]<>'.includes(char))   wait = msPerChar * 1.4;
        else                                      wait = msPerChar * (0.85 + Math.random() * 0.3);

        // Stop loop for delay — human typing effect!
        await sleep(wait);
    }

    await editor.document.save();
}

module.exports = { typeCharByChar, wpmToMsPerChar };