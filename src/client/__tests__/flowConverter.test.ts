// =============================================================================
// Unit Tests: FlowBuilder - flowConverter.ts
// =============================================================================

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import type { BlockNodeData } from '../components/FlowBuilder/types';
import type { TestSuite } from '../../core/types';
import {
  flowToJson,
  jsonToFlow,
  isFlowValid,
  getOrderedNodes,
} from '../components/FlowBuilder/flowConverter';

// -----------------------------------------------------------------------------
// Test helpers — factory functions for mock nodes and edges
// -----------------------------------------------------------------------------

function makeNode(
  id: string,
  data: BlockNodeData,
  position = { x: 0, y: 0 }
): Node<BlockNodeData> {
  return { id, type: 'block', position, data };
}

function makeEdge(source: string, target: string): Edge {
  return { id: `edge-${source}-${target}`, source, target };
}

// Pre-built node factories for each block type
function clickNode(id: string, selector = '.btn'): Node<BlockNodeData> {
  return makeNode(id, { blockType: 'click', label: 'Click', selector });
}

function fillNode(id: string, selector = '#input', value = 'hello'): Node<BlockNodeData> {
  return makeNode(id, { blockType: 'fill', label: 'Fill Input', selector, value });
}

function waitForNode(id: string, selector = '.loaded'): Node<BlockNodeData> {
  return makeNode(id, { blockType: 'waitFor', label: 'Wait For', selector });
}

function assertTextNode(
  id: string,
  selector = 'h1',
  expected = 'Welcome'
): Node<BlockNodeData> {
  return makeNode(id, { blockType: 'assertText', label: 'Assert Text', selector, expected });
}

function navigateNode(id: string, url = 'https://example.com'): Node<BlockNodeData> {
  return makeNode(id, { blockType: 'navigate', label: 'Navigate', url });
}

function loginNode(
  id: string,
  email = 'user@example.com',
  password = 'secret'
): Node<BlockNodeData> {
  return makeNode(id, { blockType: 'login', label: 'Login', email, password });
}

function logoutNode(id: string, selector = '.logout-btn'): Node<BlockNodeData> {
  return makeNode(id, { blockType: 'logout', label: 'Logout', selector });
}

// =============================================================================
// isFlowValid
// =============================================================================

describe('isFlowValid()', () => {
  it('returns false for empty node array', () => {
    expect(isFlowValid([])).toBe(false);
  });

  it('returns true for a single node', () => {
    expect(isFlowValid([clickNode('n1')])).toBe(true);
  });

  it('returns true for multiple nodes', () => {
    expect(isFlowValid([clickNode('n1'), fillNode('n2'), logoutNode('n3')])).toBe(true);
  });
});

// =============================================================================
// getOrderedNodes
// =============================================================================

describe('getOrderedNodes()', () => {
  it('returns empty array for empty input', () => {
    expect(getOrderedNodes([], [])).toEqual([]);
  });

  it('returns a single node unchanged (no edges)', () => {
    const nodes = [clickNode('n1')];
    const result = getOrderedNodes(nodes, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
  });

  it('orders a linear 3-node chain correctly', () => {
    const nodes = [clickNode('n1'), fillNode('n2'), logoutNode('n3')];
    const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')];
    const result = getOrderedNodes(nodes, edges);
    expect(result.map((n) => n.id)).toEqual(['n1', 'n2', 'n3']);
  });

  it('orders correctly even when nodes array is not in chain order', () => {
    // Supply nodes in reverse order — expect chain order in output
    const nodes = [logoutNode('n3'), fillNode('n2'), clickNode('n1')];
    const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')];
    const result = getOrderedNodes(nodes, edges);
    expect(result.map((n) => n.id)).toEqual(['n1', 'n2', 'n3']);
  });

  it('appends disconnected nodes after the chain', () => {
    const nodes = [clickNode('n1'), fillNode('n2'), navigateNode('orphan')];
    const edges = [makeEdge('n1', 'n2')];
    const result = getOrderedNodes(nodes, edges);
    // n1 → n2 is the chain; orphan comes after
    expect(result[0].id).toBe('n1');
    expect(result[1].id).toBe('n2');
    expect(result[2].id).toBe('orphan');
  });

  it('falls back to original order when no start node (cycle)', () => {
    // Cycle: n1 → n2 → n1 (every node has an incoming edge)
    const nodes = [clickNode('n1'), fillNode('n2')];
    const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n1')];
    const result = getOrderedNodes(nodes, edges);
    expect(result).toHaveLength(2);
  });

  it('handles a 5-node linear chain', () => {
    const nodes = [clickNode('a'), fillNode('b'), waitForNode('c'), assertTextNode('d'), logoutNode('e')];
    const edges = [
      makeEdge('a', 'b'),
      makeEdge('b', 'c'),
      makeEdge('c', 'd'),
      makeEdge('d', 'e'),
    ];
    const result = getOrderedNodes(nodes, edges);
    expect(result.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

// =============================================================================
// flowToJson — all 7 block types
// =============================================================================

describe('flowToJson() — block type conversion', () => {
  it('converts a click block to a UiStep with action=click', () => {
    const nodes = [clickNode('n1', '#submit-btn')];
    const result = flowToJson(nodes, []);
    const step = result.tests[0].steps[0];
    expect(step.action).toBe('click');
    expect(step.selector).toBe('#submit-btn');
  });

  it('converts a fill block to a UiStep with action=fill', () => {
    const nodes = [fillNode('n1', '#username', 'testuser')];
    const result = flowToJson(nodes, []);
    const step = result.tests[0].steps[0];
    expect(step.action).toBe('fill');
    expect(step.selector).toBe('#username');
    expect(step.value).toBe('testuser');
  });

  it('converts a waitFor block to a UiStep with action=waitFor', () => {
    const nodes = [waitForNode('n1', '.spinner-gone')];
    const result = flowToJson(nodes, []);
    const step = result.tests[0].steps[0];
    expect(step.action).toBe('waitFor');
    expect(step.selector).toBe('.spinner-gone');
  });

  it('converts an assertText block to a UiStep with action=assertText', () => {
    const nodes = [assertTextNode('n1', 'h1.title', 'Dashboard')];
    const result = flowToJson(nodes, []);
    const step = result.tests[0].steps[0];
    expect(step.action).toBe('assertText');
    expect(step.selector).toBe('h1.title');
    expect(step.expected).toBe('Dashboard');
  });

  it('converts a navigate block to a UiStep with action=navigate (url → value)', () => {
    const nodes = [navigateNode('n1', 'https://app.example.com/login')];
    const result = flowToJson(nodes, []);
    const step = result.tests[0].steps[0];
    expect(step.action).toBe('navigate');
    expect(step.value).toBe('https://app.example.com/login');
  });

  it('converts a login block to a UiStep with action=login', () => {
    const nodes = [loginNode('n1', 'admin@example.com', 'p@ssw0rd')];
    const result = flowToJson(nodes, []);
    const step = result.tests[0].steps[0];
    expect(step.action).toBe('login');
    expect(step.email).toBe('admin@example.com');
    expect(step.password).toBe('p@ssw0rd');
  });

  it('converts a logout block to a UiStep with action=logout', () => {
    const nodes = [logoutNode('n1', '.nav-logout')];
    const result = flowToJson(nodes, []);
    const step = result.tests[0].steps[0];
    expect(step.action).toBe('logout');
    expect(step.selector).toBe('.nav-logout');
  });
});

// =============================================================================
// flowToJson — structural output
// =============================================================================

describe('flowToJson() — TestSuite structure', () => {
  it('returns an empty steps array for an empty flow', () => {
    const result = flowToJson([], []);
    expect(result.tests[0].steps).toHaveLength(0);
  });

  it('uses default suite name when no options provided', () => {
    const result = flowToJson([clickNode('n1')], []);
    expect(result.name).toBe('Visual Flow Test');
    expect(result.tests[0].name).toBe('Visual Flow Test');
  });

  it('uses custom suiteName from options', () => {
    const result = flowToJson([clickNode('n1')], [], { suiteName: 'My Login Flow' });
    expect(result.name).toBe('My Login Flow');
  });

  it('uses baseUrl from options when provided', () => {
    const result = flowToJson([clickNode('n1')], [], { baseUrl: 'https://staging.example.com' });
    expect(result.baseUrl).toBe('https://staging.example.com');
    expect(result.tests[0].url).toBe('https://staging.example.com');
  });

  it('uses the first navigate block URL as test case url when no baseUrl option', () => {
    const nodes = [
      loginNode('n1'),
      navigateNode('n2', 'https://app.example.com/dashboard'),
    ];
    const result = flowToJson(nodes, []);
    expect(result.tests[0].url).toBe('https://app.example.com/dashboard');
  });

  it('falls back to empty string url when no navigate block and no baseUrl', () => {
    const nodes = [clickNode('n1')];
    const result = flowToJson(nodes, []);
    expect(result.tests[0].url).toBe('');
  });

  it('produces output of type "ui"', () => {
    const result = flowToJson([clickNode('n1')], []);
    expect(result.tests[0].type).toBe('ui');
  });

  it('orders steps by edge topology, not node array order', () => {
    // Supply nodes in reverse order; expect steps to follow the edge chain
    const nodes = [logoutNode('n3'), fillNode('n2'), clickNode('n1')];
    const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')];
    const result = flowToJson(nodes, edges);
    const actions = result.tests[0].steps.map((s) => s.action);
    expect(actions).toEqual(['click', 'fill', 'logout']);
  });

  it('handles a single-node flow (no edges)', () => {
    const nodes = [loginNode('n1', 'user@x.com', 'pass')];
    const result = flowToJson(nodes, []);
    expect(result.tests[0].steps).toHaveLength(1);
    expect(result.tests[0].steps[0].action).toBe('login');
  });
});

// =============================================================================
// jsonToFlow
// =============================================================================

describe('jsonToFlow()', () => {
  const minimalSuite: TestSuite = {
    name: 'Login Flow',
    tests: [
      {
        name: 'Login Flow',
        type: 'ui',
        url: 'https://example.com',
        steps: [
          { action: 'navigate', value: 'https://example.com' },
          { action: 'fill', selector: '#email', value: 'user@example.com' },
          { action: 'fill', selector: '#password', value: 'secret' },
          { action: 'click', selector: '#login-btn' },
          { action: 'assertText', selector: 'h1', expected: 'Dashboard' },
        ],
      },
    ],
  };

  it('creates one node per UI step', () => {
    const { nodes } = jsonToFlow(minimalSuite);
    expect(nodes).toHaveLength(5);
  });

  it('creates edges linking consecutive nodes', () => {
    const { edges } = jsonToFlow(minimalSuite);
    // 5 nodes → 4 edges
    expect(edges).toHaveLength(4);
  });

  it('creates nodes with correct blockType for each action', () => {
    const { nodes } = jsonToFlow(minimalSuite);
    expect(nodes[0].data.blockType).toBe('navigate');
    expect(nodes[1].data.blockType).toBe('fill');
    expect(nodes[2].data.blockType).toBe('fill');
    expect(nodes[3].data.blockType).toBe('click');
    expect(nodes[4].data.blockType).toBe('assertText');
  });

  it('each edge connects consecutive node ids', () => {
    const { nodes, edges } = jsonToFlow(minimalSuite);
    for (let i = 0; i < edges.length; i++) {
      expect(edges[i].source).toBe(nodes[i].id);
      expect(edges[i].target).toBe(nodes[i + 1].id);
    }
  });

  it('positions nodes vertically 200px apart starting at y=100', () => {
    const { nodes } = jsonToFlow(minimalSuite);
    expect(nodes[0].position.y).toBe(100);
    expect(nodes[1].position.y).toBe(300);
    expect(nodes[2].position.y).toBe(500);
  });

  it('sets node type to "block"', () => {
    const { nodes } = jsonToFlow(minimalSuite);
    for (const node of nodes) {
      expect(node.type).toBe('block');
    }
  });

  it('skips API test cases and only converts UI test cases', () => {
    const suiteWithApi: TestSuite = {
      name: 'Mixed Suite',
      tests: [
        {
          name: 'API Test',
          type: 'api',
          url: 'https://api.example.com',
          method: 'GET',
          assertions: [],
        },
        {
          name: 'UI Test',
          type: 'ui',
          url: 'https://example.com',
          steps: [{ action: 'click', selector: '.btn' }],
        },
      ],
    };
    const { nodes } = jsonToFlow(suiteWithApi);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].data.blockType).toBe('click');
  });

  it('returns empty nodes and edges for a suite with only API tests', () => {
    const apiOnlySuite: TestSuite = {
      name: 'API Suite',
      tests: [
        {
          name: 'Health Check',
          type: 'api',
          url: 'https://api.example.com/health',
          method: 'GET',
          assertions: [],
        },
      ],
    };
    const { nodes, edges } = jsonToFlow(apiOnlySuite);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it('correctly sets navigate node url field from step.value', () => {
    const suite: TestSuite = {
      name: 'Nav Test',
      tests: [
        {
          name: 'Nav Test',
          type: 'ui',
          url: '',
          steps: [{ action: 'navigate', value: 'https://nav.example.com' }],
        },
      ],
    };
    const { nodes } = jsonToFlow(suite);
    expect(nodes[0].data.url).toBe('https://nav.example.com');
  });

  it('correctly sets login node email and password fields', () => {
    const suite: TestSuite = {
      name: 'Login Test',
      tests: [
        {
          name: 'Login Test',
          type: 'ui',
          url: '',
          steps: [{ action: 'login', email: 'test@example.com', password: 'secret' }],
        },
      ],
    };
    const { nodes } = jsonToFlow(suite);
    expect(nodes[0].data.email).toBe('test@example.com');
    expect(nodes[0].data.password).toBe('secret');
  });
});

// =============================================================================
// Round-trip: flow → json → flow → json equivalence
// =============================================================================

describe('Round-trip: flowToJson → jsonToFlow → flowToJson', () => {
  it('click block round-trips correctly', () => {
    const originalNodes = [clickNode('n1', '#submit')];
    const suite = flowToJson(originalNodes, []);
    const { nodes: importedNodes, edges: importedEdges } = jsonToFlow(suite);
    const roundTrippedSuite = flowToJson(importedNodes, importedEdges);

    expect(roundTrippedSuite.tests[0].steps[0].action).toBe('click');
    expect(roundTrippedSuite.tests[0].steps[0].selector).toBe('#submit');
  });

  it('fill block round-trips correctly', () => {
    const originalNodes = [fillNode('n1', '#email', 'user@example.com')];
    const suite = flowToJson(originalNodes, []);
    const { nodes, edges } = jsonToFlow(suite);
    const rtSuite = flowToJson(nodes, edges);

    const step = rtSuite.tests[0].steps[0];
    expect(step.action).toBe('fill');
    expect(step.selector).toBe('#email');
    expect(step.value).toBe('user@example.com');
  });

  it('navigate block round-trips correctly (url ↔ value mapping)', () => {
    const originalNodes = [navigateNode('n1', 'https://roundtrip.example.com')];
    const suite = flowToJson(originalNodes, []);
    const { nodes, edges } = jsonToFlow(suite);
    const rtSuite = flowToJson(nodes, edges);

    const step = rtSuite.tests[0].steps[0];
    expect(step.action).toBe('navigate');
    expect(step.value).toBe('https://roundtrip.example.com');
  });

  it('login block round-trips correctly', () => {
    const originalNodes = [loginNode('n1', 'admin@example.com', 'p@ssw0rd!')];
    const suite = flowToJson(originalNodes, []);
    const { nodes, edges } = jsonToFlow(suite);
    const rtSuite = flowToJson(nodes, edges);

    const step = rtSuite.tests[0].steps[0];
    expect(step.action).toBe('login');
    expect(step.email).toBe('admin@example.com');
    expect(step.password).toBe('p@ssw0rd!');
  });

  it('assertText block round-trips correctly', () => {
    const originalNodes = [assertTextNode('n1', '.headline', 'Welcome Back')];
    const suite = flowToJson(originalNodes, []);
    const { nodes, edges } = jsonToFlow(suite);
    const rtSuite = flowToJson(nodes, edges);

    const step = rtSuite.tests[0].steps[0];
    expect(step.action).toBe('assertText');
    expect(step.selector).toBe('.headline');
    expect(step.expected).toBe('Welcome Back');
  });

  it('multi-step flow preserves step count and order after round-trip', () => {
    const originalNodes = [
      navigateNode('n1', 'https://example.com'),
      loginNode('n2', 'user@example.com', 'pass'),
      assertTextNode('n3', 'h1', 'Dashboard'),
      logoutNode('n4', '.logout'),
    ];
    const originalEdges = [
      makeEdge('n1', 'n2'),
      makeEdge('n2', 'n3'),
      makeEdge('n3', 'n4'),
    ];

    const suite1 = flowToJson(originalNodes, originalEdges);
    const { nodes: importedNodes, edges: importedEdges } = jsonToFlow(suite1);
    const suite2 = flowToJson(importedNodes, importedEdges);

    const actions1 = suite1.tests[0].steps.map((s) => s.action);
    const actions2 = suite2.tests[0].steps.map((s) => s.action);

    expect(actions2).toEqual(actions1);
    expect(actions2).toEqual(['navigate', 'login', 'assertText', 'logout']);
  });

  it('all 7 block types in a single flow round-trip with correct step order', () => {
    const originalNodes = [
      navigateNode('n1', 'https://example.com'),
      loginNode('n2'),
      clickNode('n3', '.accept-cookies'),
      fillNode('n4', '#search', 'test item'),
      waitForNode('n5', '.results'),
      assertTextNode('n6', '.result-count', '5 results'),
      logoutNode('n7'),
    ];
    const originalEdges = [
      makeEdge('n1', 'n2'),
      makeEdge('n2', 'n3'),
      makeEdge('n3', 'n4'),
      makeEdge('n4', 'n5'),
      makeEdge('n5', 'n6'),
      makeEdge('n6', 'n7'),
    ];

    const suite1 = flowToJson(originalNodes, originalEdges);
    const { nodes: importedNodes, edges: importedEdges } = jsonToFlow(suite1);
    const suite2 = flowToJson(importedNodes, importedEdges);

    const actions1 = suite1.tests[0].steps.map((s) => s.action);
    const actions2 = suite2.tests[0].steps.map((s) => s.action);
    expect(actions2).toEqual(actions1);
    expect(actions2).toEqual([
      'navigate',
      'login',
      'click',
      'fill',
      'waitFor',
      'assertText',
      'logout',
    ]);
  });
});
