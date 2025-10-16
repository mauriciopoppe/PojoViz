# Feature Specification: Node Details Sidebar

**Feature Branch**: `001-node-details-sidebar`
**Created**: 2025-10-15
**Status**: Draft
**Input**: User description: "Currently, the svelte webapp shows an svg graph with nodes and edges. When I hover over a node I highlight the current node and the predecessor and successor node. I would like to add a sidebar on top of the legend that shows details about all the predecessors (their names and which property they used to get to the current node) and all the successors (their names, and which property was used from the current node to get to the successor node)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Node Connection Details (Priority: P1)

As a user exploring the graph, I want to hover over any node and instantly see a summary of its direct connections in a sidebar. This summary should clearly list all incoming (predecessor) and outgoing (successor) nodes, including the property that defines each relationship. This allows me to understand the context of a node without losing my place in the graph.

**Why this priority**: This is the core functionality of the feature. It directly addresses the user's request and provides immediate value by enhancing graph exploration and comprehension.

**Independent Test**: Can be fully tested by hovering over a single node with known predecessors and successors and verifying that the sidebar appears with the correct information. This delivers the primary value of understanding node relationships.

**Acceptance Scenarios**:

1.  **Given** a graph is rendered and the user is not hovering over any node,
    **When** the user's cursor moves over a node,
    **Then** a sidebar appears on the screen.
2.  **Given** the user is hovering over a node with three predecessors,
    **When** the sidebar appears,
    **Then** it displays a "Predecessors" list containing three items, each showing the predecessor node's name and the connecting property.
3.  **Given** the user is hovering over a node with two successors,
    **When** the sidebar appears,
    **Then** it displays a "Successors" list containing two items, each showing the successor node's name and the connecting property.
4.  **Given** the user is hovering over a node and the sidebar is visible,
    **When** the user's cursor moves off the node,
    **Then** the sidebar disappears or its content is cleared.
5.  **Given** the user is hovering over a node with the label "MyNode",
    **When** the sidebar appears,
    **Then** it displays a "Current Node" section with the text "MyNode" above the "Predecessors" section.

---

### Edge Cases

-   **Node with no predecessors**: If a user hovers over a node with no incoming connections, the "Predecessors" section in the sidebar should be empty or display a "None" message.
-   **Node with no successors**: If a user hovers over a node with no outgoing connections, the "Successors" section in the sidebar should be empty or display a "None" message.
-   **Node with no connections**: If a user hovers over an isolated node, both the "Predecessors" and "Successors" sections should indicate that there are no connections.
-   **Sidebar and Legend overlap**: The feature description states the sidebar should be "on top of the legend". This could obscure the legend. The exact behavior needs to be defined.

## Requirements *(mandatory)*

### Functional Requirements

-   **FR-001**: The system MUST display a sidebar when a user hovers their mouse cursor over a node in the graph.
-   **FR-002**: The sidebar MUST disappear or be cleared when the user's cursor is no longer over the node.
-   **FR-003**: The sidebar MUST contain a section titled "Predecessors".
-   **FR-004**: The "Predecessors" section MUST list all nodes that have a direct connection *to* the hovered node.
-   **FR-005**: For each predecessor listed, the system MUST display its name and the name of the property used for the connection.
-   **FR-006**: The sidebar MUST contain a section titled "Successors".
-   **FR-007**: The "Successors" section MUST list all nodes that the hovered node has a direct connection *to*.
-   **FR-008**: For each successor listed, the system MUST display its name and the name of the property used for the connection.
-   **FR-009**: The sidebar MUST be rendered directly above the existing legend, ensuring both elements are visible simultaneously.
-   **FR-010**: The sidebar MUST contain a section titled "Current Node" with the label of the current node, it must be shown before the predecessors section.

### Key Entities *(include if feature involves data)*

-   **Node**: Represents an object or entity in the graph. Has a "name" and may have properties that connect to other nodes.
-   **Edge/Connection**: Represents the relationship between two nodes. It is defined by a "property" on a source node that points to a a target node.

## Success Criteria *(mandatory)*

### Measurable Outcomes

-   **SC-001**: When a user hovers over a node, the sidebar with connection details appears in under 250 milliseconds.
-   **SC-002**: The information presented in the sidebar (current node, predecessor names, successor names, and property names) is 100% accurate based on the underlying graph data model.
-   **SC-003**: The feature is successfully implemented when a user can, for any given node, correctly identify all its direct predecessors and successors by using only the sidebar.
-   **SC-004**: The introduction of the sidebar does not increase the initial graph rendering time by more than 5%.
