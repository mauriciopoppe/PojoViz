# Implementation Plan: Node Details Sidebar

**Feature Branch**: `001-node-details-sidebar`
**Feature Spec**: [spec.md](./spec.md)
**Status**: In Progress

## 1. Technical Context

### 1.1. Tech Stack
- **Framework**: Svelte (used for the overall application shell)
- **Core Logic Language**: Plain JavaScript (for this feature)
- **Graphing Library**: d3.js
- **Build Tool**: Vite
- **Styling**: CSS (via `app.css`)

### 1.2. Existing Codebase & Approach
- The user has specified that this feature should be implemented entirely within the `src/pojoviz` directory.
- The logic for the node connection details view will be encapsulated within the `Canvas` class in `src/pojoviz/renderer/d3/Canvas.js`.
- A new method, `addNodeConnectionDetails`, will be created in the `Canvas` class.
- Hover logic will be triggered from `src/pojoviz/renderer/d3/Node.js`.

### 1.3. Key Files for This Feature
- **`src/pojoviz/renderer/d3/Canvas.js`**: This is the central file for this feature. It will be modified to include the new methods for creating, showing, and hiding the details view.
- **`src/pojoviz/renderer/d3/Node.js`**: To bind hover events that will call the new methods in the `Canvas` class.
- **`src/app.css`**: To add necessary styles for the new component.

### 1.4. Unknowns & Clarifications
- All unknowns are resolved. The implementation path is clear.

## 2. Constitution Check

- The project's constitution is a template. The plan will follow standard best practices for JavaScript and d3.js development.

## 3. Implementation Phases

### Phase 0: Research & Design

- **Research**: No research is required.
- **Design**:
    1.  The `Canvas` class in `src/pojoviz/renderer/d3/Canvas.js` will be modified.
    2.  A new method `addNodeConnectionDetails()` will be added. This method will create the DOM elements for the details view (e.g., a `div` or `g` element), style them, and append them to the main container. The view will be hidden by default.
    3.  Two new methods will be added to the `Canvas` class:
        - `showNodeConnectionDetails(nodeData)`: Takes the data of the hovered node, populates the details view with predecessor and successor information, and makes it visible.
        - `hideNodeConnectionDetails()`: Hides the details view.
    4.  The `addNodeConnectionDetails` method will be called from the `Canvas` constructor or an initialization method.

### Phase 1: Implementation

#### Task Breakdown
1.  **Modify `Canvas.js`**:
    - In `src/pojoviz/renderer/d3/Canvas.js`, implement the `addNodeConnectionDetails` method to create the UI structure.
    - Implement the `showNodeConnectionDetails(nodeData)` method to populate and display the UI.
    - Implement the `hideNodeConnectionDetails()` method to hide the UI.
    - Call `this.addNodeConnectionDetails()` within the `Canvas` class, likely in the constructor or an init method.
2.  **Update `Node.js` for Hover Logic**:
    - In `src/pojoviz/renderer/d3/Node.js`, ensure that the rendering logic has access to the `Canvas` instance.
    - Attach `mouseover` and `mouseout` event listeners to the d3 nodes.
    - The `mouseover` handler will call `canvas.showNodeConnectionDetails(d)` with the node's data.
    - The `mouseout` handler will call `canvas.hideNodeConnectionDetails()`.
3.  **Add CSS Styles**:
    - In `src/app.css`, add styles for the new DOM elements to control their position, appearance, and visibility.

### Phase 2: Testing & Refinement

- **Manual Testing**:
    - Verify that hovering a node shows the details panel with correct predecessor/successor info.
    - Verify that the panel is correctly positioned in the lower right corner.
    - Verify that the panel hides on mouseout.
    - Test with nodes that have no predecessors, no successors, and no connections at all.

## 4. Generated Artifacts

- `specs/001-node-details-sidebar/plan.md` (this file)
- `specs/001-node-details-sidebar/research.md` (not needed for this iteration)
- `specs/001-node-details-sidebar/data-model.md`
- `specs/001-node-details-sidebar/quickstart.md`
