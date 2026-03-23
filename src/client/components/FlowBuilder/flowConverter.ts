// =============================================================================
// FlowBuilder - Flow ↔ JSON Converter
//
// Bidirectional conversion between React Flow nodes/edges and TestSuite JSON.
// Output is fully compatible with the existing CLI and suite-runner.
// =============================================================================

import type { Node, Edge } from '@xyflow/react';
import type { TestSuite, UiTestCase, UiStep } from '../../../core/types';
import type { BlockNodeData, BlockType } from './types';

// -----------------------------------------------------------------------------
// Public option types
// -----------------------------------------------------------------------------

export interface FlowToJsonOptions {
  suiteName?: string;
  baseUrl?: string;
}

// -----------------------------------------------------------------------------
// flowToJson — React Flow graph → TestSuite JSON
// -----------------------------------------------------------------------------

/**
 * Convert a React Flow node/edge graph to a standard TestSuite JSON object.
 *
 * Steps are ordered by following the edge chain from the start node
 * (the node with no incoming edges). Disconnected nodes are appended
 * at the end in an unspecified order.
 */
export function flowToJson(
  nodes: Node<BlockNodeData>[],
  edges: Edge[],
  options: FlowToJsonOptions = {}
): TestSuite {
  const suiteName = options.suiteName ?? 'Visual Flow Test';
  const orderedNodes = getOrderedNodes(nodes, edges);

  const steps = orderedNodes
    .map((node) => blockNodeDataToUiStep(node.data))
    .filter((step): step is UiStep => step !== null);

  const startUrl = options.baseUrl ?? findStartUrl(orderedNodes);

  const testCase: UiTestCase = {
    name: suiteName,
    type: 'ui',
    url: startUrl,
    steps,
  };

  return {
    name: suiteName,
    baseUrl: options.baseUrl,
    tests: [testCase],
  };
}

// -----------------------------------------------------------------------------
// jsonToFlow — TestSuite JSON → React Flow nodes + edges
// -----------------------------------------------------------------------------

const NODE_VERTICAL_SPACING_PX = 200;
const NODE_CENTER_X = 300;
const NODE_START_Y = 100;

/**
 * Convert a TestSuite JSON object to React Flow nodes and edges.
 *
 * Only UI test cases are converted to block nodes; API test cases are skipped
 * because the flow builder is designed for UI tests only.
 * Nodes are laid out vertically, 200 px apart.
 */
export function jsonToFlow(suite: TestSuite): { nodes: Node<BlockNodeData>[]; edges: Edge[] } {
  const nodes: Node<BlockNodeData>[] = [];
  const edges: Edge[] = [];

  let nodeIndex = 0;

  for (const testCase of suite.tests) {
    if (testCase.type !== 'ui') {
      // API tests are not representable as flow blocks — skip silently.
      continue;
    }

    for (const step of testCase.steps) {
      const nodeId = generateNodeId(nodeIndex);
      const nodeData = uiStepToBlockNodeData(step);
      const yPosition = NODE_START_Y + nodeIndex * NODE_VERTICAL_SPACING_PX;

      const node: Node<BlockNodeData> = {
        id: nodeId,
        type: 'block',
        position: { x: NODE_CENTER_X, y: yPosition },
        data: nodeData,
      };

      nodes.push(node);

      if (nodeIndex > 0) {
        const previousNodeId = generateNodeId(nodeIndex - 1);
        edges.push(createEdge(previousNodeId, nodeId));
      }

      nodeIndex++;
    }
  }

  return { nodes, edges };
}

// -----------------------------------------------------------------------------
// isFlowValid — guard for empty flows
// -----------------------------------------------------------------------------

/**
 * Returns true when the flow has at least one node to convert.
 */
export function isFlowValid(nodes: Node<BlockNodeData>[]): boolean {
  return nodes.length > 0;
}

// -----------------------------------------------------------------------------
// getOrderedNodes — topological sort for a linear chain
// -----------------------------------------------------------------------------

/**
 * Return nodes sorted by following the edge chain from the start node.
 *
 * The start node is the one with no incoming edges. Disconnected nodes
 * (unreachable from the start) are appended after the chain in the order
 * they appear in the original array.
 */
export function getOrderedNodes(
  nodes: Node<BlockNodeData>[],
  edges: Edge[]
): Node<BlockNodeData>[] {
  if (nodes.length === 0) return [];

  const nodeById = buildNodeMap(nodes);
  const outgoingEdge = buildOutgoingEdgeMap(edges);
  const nodesWithIncomingEdge = new Set(edges.map((edge) => edge.target));

  const startNode = nodes.find((node) => !nodesWithIncomingEdge.has(node.id));

  if (!startNode) {
    // Cycle or no clear start — fall back to original order.
    return [...nodes];
  }

  const orderedNodes: Node<BlockNodeData>[] = [];
  const visitedIds = new Set<string>();

  let currentNodeId: string | null = startNode.id;

  while (currentNodeId !== null && !visitedIds.has(currentNodeId)) {
    visitedIds.add(currentNodeId);
    const currentNode = nodeById.get(currentNodeId);

    if (currentNode) {
      orderedNodes.push(currentNode);
    }

    currentNodeId = outgoingEdge.get(currentNodeId) ?? null;
  }

  // Append any disconnected nodes not reached by the chain.
  for (const node of nodes) {
    if (!visitedIds.has(node.id)) {
      orderedNodes.push(node);
    }
  }

  return orderedNodes;
}

// -----------------------------------------------------------------------------
// Private helpers — block ↔ step conversion
// -----------------------------------------------------------------------------

function blockNodeDataToUiStep(data: BlockNodeData): UiStep | null {
  switch (data.blockType) {
    case 'click':
      return { action: 'click', selector: data.selector };

    case 'fill':
      return { action: 'fill', selector: data.selector, value: data.value };

    case 'waitFor':
      return { action: 'waitFor', selector: data.selector };

    case 'assertText':
      return { action: 'assertText', selector: data.selector, expected: data.expected };

    case 'navigate':
      return { action: 'navigate', value: data.url };

    case 'login':
      return { action: 'login', email: data.email, password: data.password };

    case 'logout':
      return { action: 'logout', selector: data.selector };

    default: {
      // Exhaustiveness check — TypeScript will warn if a new BlockType is added
      // without a corresponding case here.
      const exhaustiveCheck: never = data.blockType;
      console.warn(`flowConverter: unknown block type "${exhaustiveCheck as string}"`);
      return null;
    }
  }
}

function uiStepToBlockNodeData(step: UiStep): BlockNodeData {
  const blockType = step.action as BlockType;

  const base: BlockNodeData = {
    blockType,
    label: labelForAction(step.action),
  };

  switch (step.action) {
    case 'click':
      return { ...base, selector: step.selector };

    case 'fill':
      return { ...base, selector: step.selector, value: step.value };

    case 'waitFor':
      return { ...base, selector: step.selector };

    case 'assertText':
      return { ...base, selector: step.selector, expected: step.expected };

    case 'navigate':
      // UiStep stores the URL in `value`; BlockNodeData uses `url`.
      return { ...base, url: step.value };

    case 'login':
      return { ...base, email: step.email, password: step.password };

    case 'logout':
      return { ...base, selector: step.selector };

    default: {
      const exhaustiveCheck: never = step.action;
      console.warn(`flowConverter: unknown step action "${exhaustiveCheck as string}"`);
      return base;
    }
  }
}

// -----------------------------------------------------------------------------
// Private helpers — ID / edge generation
// -----------------------------------------------------------------------------

function generateNodeId(index: number): string {
  return `node-${index}`;
}

function createEdge(sourceId: string, targetId: string): Edge {
  return {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
  };
}

// -----------------------------------------------------------------------------
// Private helpers — data structure utilities
// -----------------------------------------------------------------------------

function buildNodeMap(nodes: Node<BlockNodeData>[]): Map<string, Node<BlockNodeData>> {
  return new Map(nodes.map((node) => [node.id, node]));
}

/** Returns a map of sourceId → targetId for each edge (linear chain assumption). */
function buildOutgoingEdgeMap(edges: Edge[]): Map<string, string> {
  const outgoing = new Map<string, string>();
  for (const edge of edges) {
    outgoing.set(edge.source, edge.target);
  }
  return outgoing;
}

/**
 * Find the URL to use as the UiTestCase.url.
 * Looks for the first navigate block; falls back to an empty string.
 */
function findStartUrl(nodes: Node<BlockNodeData>[]): string {
  const navigateNode = nodes.find((node) => node.data.blockType === 'navigate');
  return navigateNode?.data.url ?? '';
}

/** Returns a human-readable default label for each action type. */
function labelForAction(action: UiStep['action']): string {
  const labels: Record<UiStep['action'], string> = {
    click: 'Click',
    fill: 'Fill',
    waitFor: 'Wait For',
    assertText: 'Assert Text',
    navigate: 'Navigate',
    login: 'Login',
    logout: 'Logout',
  };
  return labels[action] ?? action;
}
