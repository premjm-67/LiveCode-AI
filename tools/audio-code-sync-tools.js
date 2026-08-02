const vscode = require('vscode');
const { typeCharByChar, wpmToMsPerChar } = require('./typing-simulation-tools');

// Load say module
let say = null;
try {
    say = require('say');
    console.log('✅ say module loaded');
} catch {
    console.warn('⚠️ say module not found. Run: npm install say');
}

// Output channel
let outputChannel = null;

function getChannel() {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('LiveCode AI 🎙️');
    }
    return outputChannel;
}

function showChunkInPanel(index, total, explanation) {
    const ch = getChannel();
    ch.appendLine('');
    ch.appendLine('─'.repeat(55));
    ch.appendLine(`📖  Chunk ${index} / ${total}`);
    ch.appendLine('─'.repeat(55));
    ch.appendLine(explanation);
    ch.show(true);
}

// speakText — JS calls say.speak() once
// OS takes over speaking independently
// Promise resolves when OS fires callback (speaking done)
function speakText(text, speed = 1.0) {
    return new Promise(resolve => {
        if (!say) {
            console.warn('say not available');
            resolve();
            return;
        }
        // say.speak() hands to OS immediately
        // JS is FREE after this!
        // Promise stays PENDING until OS done speaking
        say.speak(text, undefined, speed, (err) => {
            if (err) console.warn(`speakText error: ${err}`);
            resolve(); // Promise FULFILLED when OS done!
        });
    });
}

function stopSpeech() {
    if (say) {
        try { say.stop(); } catch { }
    }
}

// Main sync engine
async function explainAndTypeChunks(filepath, chunks, wpm = 40, speechSpeed = 1.0) {
    const msPerChar = wpmToMsPerChar(wpm);

    // Show session header
    const ch = getChannel();
    ch.clear();
    ch.appendLine('═'.repeat(55));
    ch.appendLine('🤖  LiveCode AI — Session Started');
    ch.appendLine('═'.repeat(55));
    ch.appendLine(`📁  File   : ${filepath}`);
    ch.appendLine(`⌨️   Speed  : ${wpm} WPM → ${msPerChar}ms/char`);
    ch.appendLine(`📦  Chunks : ${chunks.length}`);
    ch.appendLine(`🔊  Voice  : ${say ? 'enabled' : 'disabled'}`);
    ch.appendLine('═'.repeat(55));
    ch.show(true);

    let isFirstChunk = true;

    for (let i = 0; i < chunks.length; i++) {
        const { code, explanation } = chunks[i];

        // Show in output panel
        showChunkInPanel(i + 1, chunks.length, explanation);

        // Both start simultaneously via Promise.all
        // speakText → OS takes over → Promise PENDING
        // typeCharByChar → JS types char by char
        // Promise.all waits until BOTH fulfilled
        await Promise.all([
            speakText(explanation, speechSpeed),
            typeCharByChar(filepath, code, msPerChar, !isFirstChunk)
        ]);

        isFirstChunk = false;
        console.log(`✅ Chunk ${i + 1}/${chunks.length} done`);
    }
}

module.exports = { explainAndTypeChunks, speakText, stopSpeech };