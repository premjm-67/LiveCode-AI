# 🤖TutorX

> **An AI-powered real-time coding tutor that takes full programmatic control over VS Code —
> creating files, typing code at human speed, and explaining it with synchronized voice output.**
---
## 🎯 What is TutorX

TutorX is a **VS Code Extension** that acts as an **MCP (Model Context Protocol) Server**,
giving Claude Desktop direct programmatic control over your VS Code environment.

Unlike GitHub Copilot which only **suggests** code, Live Code AI goes further:

| | GitHub Copilot | Live Code AI |
|---|---|---|
| Works inside | VS Code only | Claude Desktop → VS Code |
| CRUD operations | ❌ | ✅ Full create, read, update, delete |
| Typing simulation | ❌ Instant paste | ✅ Types at 40 WPM like a human |
| Voice explanation | ❌ | ✅ Speaks using text-to-speech |
| Audio-code sync | ❌ | ✅ Types + speaks simultaneously |
| Terminal control | Limited | ✅ Full shell command execution |
| Error analysis | ❌ | ✅ Real-time diagnostics |

> *"GitHub Copilot suggests. Live Code AI teaches."*

---

## ✨ Key Features

### 1. 📁 CRUD File Operations
Full create, read, update, and delete control over workspace files directly from Claude.

```
You: "Create a new file src/utils/helper.ts"
 → File appears in VS Code, opened in editor ✅

You: "Delete the old test files"
 → Files moved to trash ✅
```

### 2. ⌨️ Real-time Typing Simulation Engine
Types code **character-by-character** at configurable WPM speed using VS Code's editor API —
user watches code appear live, just like watching a real developer code.

```
40 WPM  →  300ms per character
80 WPM  →  150ms per character

Natural timing variation:
  Newlines     → 2.2× delay   (pause after finishing a line)
  Spaces       → 0.7× delay   (faster between words)
  Punctuation  → 1.4× delay   (slight hesitation)
  Letters      → random 0.85–1.15× (natural finger-speed variation)
```

### 3. 🎙️ Bi-modal Audio–Code Synchronization System
The most powerful feature — estimates audio duration from explanation text, derives
the exact typing speed, and launches **voice + typing simultaneously** so both finish
at the exact same moment — chunk by chunk.

```
Chunk 1:
  🔊 "We start by importing the Scanner class..."   ← speaking
  ⌨️  import java.util.Scanner;                     ← typing at 40 WPM
       Both finish at the same time ✅

Chunk 2:
  🔊 "Now we define the isPalindrome method..."     ← speaking
  ⌨️  static boolean isPalindrome(String s) {       ← typing at 40 WPM
       Both finish at the same time ✅
```

### 4. 🖥️ Terminal Command Execution
Runs shell commands inside VS Code's integrated terminal with real-time output capture.

### 5. 🔍 Code Intelligence
- Get all errors and warnings from VS Code's language servers
- Search functions, classes, variables across the entire workspace
- Get full file structure and symbol hierarchy

---

## 🏗️ Architecture

```
Claude Desktop (AI Client)
        │
        │  HTTP via mcp-remote
        ▼
http://localhost:3000/mcp
        │
        ▼
VS Code Extension (MCP Server)
        │
        ├── server.ts                    → Express HTTP + MCP Protocol
        ├── extension.ts                 → VS Code Extension Lifecycle
        │
        └── src/tools/
             ├── crud-file-tools.ts          → CREATE READ UPDATE DELETE
             ├── typing-simulation-tools.ts  → Human-speed typing engine
             ├── audio-code-sync-tools.ts    → Audio + typing sync system
             ├── shell-tools.ts              → Terminal command execution
             ├── diagnostics-tools.ts        → Error and warning analysis
             ├── symbol-tools.ts             → Code structure search
             ├── file-tools.ts               → Workspace file navigation
             └── focus.ts                    → Window focus manager
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| AI Client | Claude Desktop |
| Protocol | Model Context Protocol (MCP) |
| Transport | StreamableHTTP via `mcp-remote` |
| Extension Runtime | VS Code Extension API |
| Server | Node.js + Express |
| Language | JavaScript|
| Voice / TTS | `say` npm module |
| MCP SDK | `@modelcontextprotocol/sdk` |
| Schema Validation | `zod` |

---

## 📦 MCP Tools Reference

### CRUD File Tools
| Tool | Description |
|---|---|
| `create_new_file` | Creates a new file and opens it in the editor |
| `read_file_content` | Reads file content with optional line range |
| `update_file_lines` | Replaces specific lines with original-code validation |
| `delete_file_or_folder` | Deletes file or folder (moves to trash) |

### Typing Simulation Tools
| Tool | Description |
|---|---|
| `simulate_human_typing` | Types code character-by-character at specified WPM |
| `estimate_typing_duration` | Estimates typing duration for audio sync calculation |

### Audio-Code Sync Tools
| Tool | Description |
|---|---|
| `explain_and_type_chunks` | Types + speaks chunk by chunk in perfect sync |
| `explain_code_with_voice` | Speaks explanation + shows in VS Code output panel |
| `stop_voice_explanation` | Stops any ongoing voice immediately |

### Utility Tools
| Tool | Description |
|---|---|
| `execute_shell_command_code` | Runs shell commands in VS Code terminal |
| `get_diagnostics_code` | Gets errors and warnings from language servers |
| `search_symbols_code` | Searches functions and classes across workspace |
| `get_document_symbols_code` | Gets full file outline and structure |
| `list_files_code` | Lists workspace files |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- VS Code 1.99+
- Claude Desktop
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/live-code-ai
cd live-code-ai/chatbot-mcp

# 2. Install dependencies
npm install

# 3. Install say module for voice output
npm install say

# 4. Compile TypeScript
npm run compile
```

### Configure Claude Desktop

Find your config file:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Add this content:

```json
{
  "mcpServers": {
    "vscode-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote@next",
        "http://localhost:3000/mcp"
      ]
    }
  }
}
```

### Start the Extension

```bash
# Open project in VS Code
code .
```

1. Press **F5** → Extension Development Host window opens
2. In the new window: `Ctrl+Shift+P` → **Toggle MCP Server**
3. Look for: `MCP Server enabled and running at http://localhost:3000/mcp`
4. Restart Claude Desktop → look for 🔨 hammer icon in chat input

---

## 🎬 Demo

Ask Claude Desktop:

> *"Type a palindrome checker in gugan.java at 40 WPM and explain it chunk by chunk with voice"*

**What happens:**

```
📁 gugan.java created and opened in VS Code

Chunk 1:
  🔊 "We start by importing Scanner and declaring our class"
  ⌨️  import java.util.Scanner;        ← typing live at 40 WPM

Chunk 2:
  🔊 "The isPalindrome method uses two pointers from both ends"
  ⌨️  static boolean isPalindrome(...) ← typing live at 40 WPM

Chunk 3:
  🔊 "The main method reads input and checks if it is a palindrome"
  ⌨️  public static void main(...)     ← typing live at 40 WPM

✅ Full palindrome program typed and explained — audio and typing in sync!
```

---

## ⚙️ Extension Settings

| Setting | Default | Description |
|---|---|---|
| `vscode-mcp-server.port` | `3000` | MCP server port |
| `vscode-mcp-server.defaultEnabled` | `false` | Auto-start on VS Code launch |
| `vscode-mcp-server.enabledTools.file` | `true` | Enable file tools |
| `vscode-mcp-server.enabledTools.edit` | `true` | Enable edit tools |
| `vscode-mcp-server.enabledTools.shell` | `true` | Enable shell tools |
| `vscode-mcp-server.enabledTools.diagnostics` | `true` | Enable diagnostics tools |
| `vscode-mcp-server.enabledTools.symbol` | `true` | Enable symbol tools |

---

## 🔑 Key Technical Decisions

**Why VS Code Extension instead of standalone server?**
> VS Code Extensions access internal APIs — language servers, diagnostics,
> workspace file system, terminal shell integration — unavailable to standalone servers.

**Why MCP Protocol?**
> MCP is Anthropic's open standard for connecting AI models to external tools.
> Any MCP-compatible AI can connect without code changes.

**Why chunk-based audio-code sync?**
> Chunk-by-chunk processing gives precise alignment — each spoken explanation
> matches exactly the code being typed at that moment, creating a seamless tutoring experience.

**Why `node-window-manager` as optional dependency?**
> The package uses native C++ bindings that may fail on newer Node versions.
> Dynamic `require()` in try-catch ensures graceful fallback on all Node versions.

---

## 📁 Project Structure

```
live-code-ai/
└── chatbot-mcp/
    ├── src/
    │   ├── tools/
    │   │   ├── crud-file-tools.ts
    │   │   ├── typing-simulation-tools.ts
    │   │   ├── audio-code-sync-tools.ts
    │   │   ├── shell-tools.ts
    │   │   ├── diagnostics-tools.ts
    │   │   ├── symbol-tools.ts
    │   │   ├── file-tools.ts
    │   │   └── focus.ts
    │   ├── utils/
    │   │   └── logger.ts
    │   ├── server.ts
    │   └── extension.ts
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ — A real-time AI coding tutor that goes beyond suggestions,
giving Claude full programmatic control over your development environment.

**⭐ Star this repo if you found it useful!**

</div>
