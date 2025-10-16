# Tasks: Node Details Sidebar

**Input**: Design documents from `/specs/001-node-details-sidebar/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup tasks are required for this feature as it is an enhancement to an existing component.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks are required.

---

## Phase 3: User Story 1 - View Node Connection Details (Priority: P1) 🎯 MVP

**Goal**: When a user hovers over a node, a details view appears showing the node's predecessors and successors.

**Independent Test**: Hover over a node in the graph and verify that the details view appears with the correct information.

### Implementation for User Story 1

- [x] T001 [US1] In `src/pojoviz/renderer/d3/Canvas.js`, implement the `addNodeConnectionDetails` method to create the UI structure for the details view.
- [x] T002 [US1] In `src/pojoviz/renderer/d3/Canvas.js`, implement the `showNodeConnectionDetails(nodeData)` method to populate and display the UI.
- [x] T003 [US1] In `src/pojoviz/renderer/d3/Canvas.js`, implement the `hideNodeConnectionDetails()` method to hide the UI.
- [x] T004 [US1] In `src/pojoviz/renderer/d3/Canvas.js`, call `this.addNodeConnectionDetails()` from the constructor or an init method.
- [x] T005 [US1] In `src/pojoviz/renderer/d3/Node.js`, ensure the rendering logic has access to the `Canvas` instance.
- [x] T006 [US1] In `src/pojoviz/renderer/d3/Node.js`, attach `mouseover` and `mouseout` event listeners to the d3 nodes.
- [x] T007 [US1] In `src/pojoviz/renderer/d3/Node.js`, the `mouseover` handler should call `canvas.showNodeConnectionDetails(d)`.
- [x] T008 [US1] In `src/pojoviz/renderer/d3/Node.js`, the `mouseout` handler should call `canvas.hideNodeConnectionDetails()`.
- [x] T009 [P] [US1] In `src/app.css`, add styles for the new DOM elements to control their position, appearance, and visibility.
- [x] T011 [US1] In `src/pojoviz/renderer/d3/Canvas.js`, update `addNodeConnectionDetails` and `showNodeConnectionDetails` to display the current node's label.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T010 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 3)**: Can start immediately.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.

### Within Each User Story

- T001, T002, T003, T004 should be completed before T005, T006, T007, T008.
- T009 can be done in parallel with other tasks.

### Parallel Opportunities

- T009 can be done in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1
2. **STOP and VALIDATE**: Test User Story 1 independently
3. Deploy/demo if ready
