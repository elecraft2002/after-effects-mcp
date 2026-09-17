# 🎬 After Effects MCP Server

![Node.js](https://img.shields.io/badge/node-%3E=14.x-brightgreen.svg)
![Build](https://img.shields.io/badge/build-passing-success)
![License](https://img.shields.io/github/license/Dakkshin/after-effects-mcp)
![Platform](https://img.shields.io/badge/platform-after%20effects-blue)

✨ A Model Context Protocol (MCP) server for Adobe After Effects that enables AI assistants and other applications to control After Effects through a standardized protocol.

<a href="https://glama.ai/mcp/servers/@Dakkshin/after-effects-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Dakkshin/after-effects-mcp/badge" alt="mcp-after-effects MCP server" />
</a>

## Table of Contents
- [Features](#features)
  - [Core Composition Features](#core-composition-features)
  - [Layer Management](#layer-management)
  - [Animation Capabilities](#animation-capabilities)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Update MCP Config](#Update-MCP-Config)
  - [Running the Server](#running-the-server)
- [Usage Guide](#usage-guide)
  - [Creating Compositions](#creating-compositions)
  - [Working with Layers](#working-with-layers)
  - [Animation](#animation)
  - [Batch Operations](#batch-operations)
  - [Preview & Visual Feedback](#preview--visual-feedback)
  - [Logo / Brand Color Extraction](#logo--brand-color-extraction)
- [Available MCP Tools](#available-mcp-tools)
- [For Developers](#for-developers)
  - [Project Structure](#project-structure)
  - [Building the Project](#building-the-project)
  - [Contributing](#contributing)
- [License](#license)

## 📦 Features

### 🎥 Core Composition Features
- **Create compositions** with custom settings (size, frame rate, duration, background color)
- **List all compositions** in a project
- **Get project information** such as frame rate, dimensions, and duration

### 🧱 Layer Management
- **Create text layers** with customizable properties (font, size, color, position)
- **Create shape layers** (rectangle, ellipse, polygon, star) with colors and strokes
- **Create solid/adjustment layers** for backgrounds and effects
- **Create camera layers** with configurable zoom and position
- **Create null objects** for animation control
- **Modify layer properties** like position, scale, rotation, opacity, timing
- **Toggle 2D/3D mode** for layers
- **Set blend modes** (normal, multiply, screen, etc.)
- **Track matte** support (alpha, luma, inverted)
- **Duplicate layers** with optional rename
- **Delete layers** from composition
- **Create/modify masks** with feather, expansion, and opacity
- **Reorder layers** (bring to front/back, move before/after another layer)
- **Parent/unparent layers** for rigging

### 🌀 Animation Capabilities
- **Set keyframes** for layer properties (Position, Scale, Rotation, Opacity, etc.)
- **Apply expressions** to layer properties for dynamic animations
- **Batch set properties** across multiple layers at once

### ⚡ Batch Operations & Feedback
- **Run many operations in one round trip** — create, modify, and reorder several layers (e.g. "add 5 layers") in a single tool call instead of one at a time
- **Render a preview frame back to the AI** as an image, so it can see the current state of the composition and keep iterating
- **Extract a color palette from a layer** (e.g. an imported logo) to reuse across the rest of the design
- Tool calls return real results directly (no more "queue it, then call get-results" two-step)

## ⚙️ Setup Instructions

### 🛠 Prerequisites
- Adobe After Effects (2022 or later)
- Node.js (v14 or later)
- npm or yarn package manager

### 📥 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dakkshin/after-effects-mcp.git
   cd after-effects-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Build the project**
   ```bash
   npm run build
   # or
   yarn build
   ```

4. **Install the After Effects panel**
   ```bash
   npm run install-bridge
   # or
   yarn install-bridge
   ```
   This will copy the necessary scripts to your After Effects installation.

### 🔧 Update MCP Config

#### Option 1: Using .mcp.json (Recommended for Claude Code)
The repository includes a `.mcp.json` file for easy configuration. Copy or reference it in your MCP settings:

```json
{
  "mcpServers": {
    "AfterEffectsMCP": {
      "command": "node",
      "args": ["PATH/TO/after-effects-mcp/build/index.js"]
    }
  }
}
```

#### Option 2: Manual Configuration
Go to your client (e.g., Claude or Cursor) and update your config file:

```json
{
  "mcpServers": {
    "AfterEffectsMCP": {
      "command": "node",
      "args": ["C:\\Users\\Dakkshin\\after-effects-mcp\\build\\index.js"]
    }
  }
}
```

### ▶️ Running the Server

1. **Start the MCP server**
   ```bash
   npm start
   # or
   yarn start
   ```

2. **Open After Effects**

3. **Open the MCP Bridge Auto panel**
   - In After Effects, go to Window > mcp-bridge-auto.jsx
   - The panel will automatically check for commands every few seconds
   - Make sure the "Auto-run commands" checkbox is enabled

## 🚀 Usage Guide

Once you have the server running and the MCP Bridge panel open in After Effects, you can control After Effects through the MCP protocol. This allows AI assistants or custom applications to send commands to After Effects.

### 📘 Creating Compositions

You can create new compositions with custom settings:
- Name
- Width and height (in pixels)
- Frame rate
- Duration
- Background color

Example MCP tool usage (for developers):
```javascript
mcp_aftereffects_create_composition({
  name: "My Composition", 
  width: 1920, 
  height: 1080, 
  frameRate: 30,
  duration: 10
});
```

### ✍️ Working with Layers

You can create and modify different types of layers:

**Text layers:**
- Set text content, font, size, and color
- Position text anywhere in the composition
- Adjust timing and opacity

**Shape layers:**
- Create rectangles, ellipses, polygons, and stars
- Set fill and stroke colors
- Customize size and position

**Solid layers:**
- Create background colors
- Make adjustment layers for effects

### 🕹 Animation

You can animate layers with:

**Keyframes:**
- Set property values at specific times
- Create motion, scaling, rotation, and opacity changes
- Control the timing of animations

**Expressions:**
- Apply JavaScript expressions to properties
- Create dynamic, procedural animations
- Connect property values to each other

### 📦 Batch Operations

Instead of adding or changing layers one at a time, send a list of operations in a single `batch-execute` call. Each operation is any command also accepted by `run-script` (e.g. `createTextLayer`, `createShapeLayer`, `setLayerProperties`, `reorderLayer`). All operations run inside one Undo step, and by default the batch keeps going even if one operation fails so you still get the results of the rest.

Example — "add five layers" in one round trip:
```javascript
batch_execute({
  operations: [
    { command: "createTextLayer", args: { text: "Hello", position: [960, 200] } },
    { command: "createShapeLayer", args: { shapeType: "ellipse", position: [960, 540] } },
    { command: "createSolidLayer", args: { color: [0.1, 0.1, 0.1], name: "BG" } },
    { command: "createShapeLayer", args: { shapeType: "star", position: [400, 700] } },
    { command: "createTextLayer", args: { text: "Subtitle", position: [960, 800], fontSize: 36 } }
  ]
});
```
The result includes a per-operation status plus a fresh snapshot of every layer in the composition (`compSnapshot`), so there's no need for a follow-up `getLayerInfo` call just to see what changed.

### 🖼️ Preview & Visual Feedback

`render-preview` renders one frame of a composition and returns it as an image, so the AI can actually look at the current state of the scene and keep iterating instead of working blind. Under the hood this drives After Effects' Render Queue (ExtendScript has no direct screenshot API), so it takes a few seconds and requires at least one PNG-capable Output Module template (After Effects ships with "PNG Sequence" by default). Pass `maxWidth` to render a downscaled copy and keep the image small/cheap to send back.

### 🎨 Logo / Brand Color Extraction

`analyze-layer-colors` samples a layer already placed in a composition — for example an imported logo — and returns its dominant colors plus an average color. Each palette entry includes `rgb01` (ready to pass straight back into `fillColor`/`backgroundColor`/`color` on other tools), `rgb255`, and `hex`, so a typical flow looks like:

1. Import the logo and add it to the composition.
2. Call `analyze-layer-colors` on that layer.
3. Feed `palette[0].rgb01` (or the other entries) into `createSolidLayer`, `createShapeLayer`, or `createTextLayer` to keep the rest of the design consistent with the logo.

## 🛠 Available MCP Tools

Tool calls queue a command for the "MCP Bridge Auto" panel and wait for the panel to pick it up and finish, returning the actual result directly — there's no need to separately call `get-results` afterwards (that tool, and `run-script`, are still available for manual/advanced use).

| Command                     | Description                            |
|-----------------------------|----------------------------------------|
| `create-composition`        | Create a new composition               |
| `batch-execute`              | Run several operations (any command below) in one round trip, in a single Undo step |
| `run-script`                | Run a JS script inside AE              |
| `get-results`               | Get script results                     |
| `get-help`                  | Help for available commands            |
| `setLayerKeyframe`          | Add keyframe to layer property         |
| `setLayerExpression`        | Add/remove expressions from properties|
| `setLayerProperties`        | Set layer properties (position, scale, rotation, opacity, blendMode, threeDLayer, trackMatteType, enabled, etc.) |
| `batchSetLayerProperties`  | Apply properties to multiple layers   |
| `getLayerInfo`              | Get layer info (position, 3D status)  |
| `createCamera`              | Create camera layer                   |
| `createNullObject`          | Create null object for animation      |
| `duplicateLayer`            | Duplicate a layer                     |
| `deleteLayer`               | Delete a layer                        |
| `setLayerMask`              | Create/modify layer masks             |
| `reorder-layer`              | Move a layer to the front/back or before/after another layer |
| `set-layer-parent`           | Set or clear a layer's parent (rigging) |
| `render-preview`             | Render a frame of a composition and return it as an image |
| `analyze-layer-colors`       | Extract a dominant color palette from a layer (e.g. a logo) |

## 👨‍💻 For Developers

### 🧩 Project Structure

- `src/index.ts`: MCP server implementation
- `src/scripts/mcp-bridge-auto.jsx`: Main After Effects panel script
- `install-bridge.js`: Script to install the panel in After Effects

### 📦 Building the Project

```bash
npm run build
# or
yarn build
```

**Note:** This project uses esbuild for fast builds, replacing the previous TypeScript compiler approach that could run out of memory on larger codebases.

**Note:** After changing `src/scripts/mcp-bridge-auto.jsx`, rebuild and re-run `npm run install-bridge`, then close and reopen the panel in After Effects (Window > mcp-bridge-auto.jsx) — After Effects keeps the script it loaded in memory, so it won't pick up changes to the file on disk until the panel is reopened.

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Dakkshin/after-effects-mcp&type=date&legend=top-left)](https://www.star-history.com/#Dakkshin/after-effects-mcp&type=date&legend=top-left)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
