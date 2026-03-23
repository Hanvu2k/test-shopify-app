// =============================================================================
// FlowBuilder — Container component that manages React Flow state and
// orchestrates the canvas, palette slot, and properties slot.
//
// State: nodes, edges, selectedNodeId
// Responsibilities:
//   - Drop from palette → create new block node
//   - Click node → select it
//   - Click canvas → deselect
//   - Delete node mid-chain → reconnect edges (A→B→C, delete B → A→C)
//   - Expose onFlowChange callback for parent consumers
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import { FlowCanvas } from './FlowCanvas';
import { BlockPalette } from './BlockPalette';
import { BlockProperties } from './BlockProperties';
import type { BlockNodeData, BlockType } from './types';
import { BLOCK_TYPE_MAP } from './constants';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FlowBuilderProps {
  onFlowChange?: (nodes: Node<BlockNodeData>[], edges: Edge[]) => void;
  initialNodes?: Node<BlockNodeData>[];
  initialEdges?: Edge[];
}

// ---------------------------------------------------------------------------
// Internal builder (must be inside ReactFlowProvider)
// ---------------------------------------------------------------------------

function FlowBuilderInner({
  onFlowChange,
  initialNodes = [],
  initialEdges = [],
}: FlowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // --- State ---
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BlockNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Counter for generating unique node IDs
  const nodeIdCounter = useRef(initialNodes.length);

  // --- Notify parent of changes ---
  useEffect(() => {
    onFlowChange?.(nodes, edges);
  }, [nodes, edges, onFlowChange]);

  // --- Connect two nodes via edge ---
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', animated: true }, eds));
    },
    [setEdges],
  );

  // --- Node click → select ---
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<BlockNodeData>) => {
      setSelectedNodeId(node.id);
    },
    [],
  );

  // --- Canvas click → deselect ---
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // --- Drag over canvas (allow drop) ---
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // --- Drop from palette → create new block ---
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const blockType = event.dataTransfer.getData('application/reactflow-blocktype') as BlockType;
      if (!blockType) return;

      const definition = BLOCK_TYPE_MAP.get(blockType);
      if (!definition) return;

      // Convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      nodeIdCounter.current += 1;
      const newNode: Node<BlockNodeData> = {
        id: `block-${nodeIdCounter.current}`,
        type: 'block',
        position,
        data: {
          blockType,
          label: definition.label,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
    },
    [screenToFlowPosition, setNodes],
  );

  // --- Custom node deletion with edge reconnection ---
  // When a node mid-chain is deleted (A→B→C), reconnect A→C.
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<BlockNodeData>>[]) => {
      // Check for node removals and reconnect edges
      for (const change of changes) {
        if (change.type === 'remove') {
          const removedId = change.id;

          // Find incoming and outgoing edges of the removed node
          setEdges((currentEdges) => {
            const incoming = currentEdges.filter((e) => e.target === removedId);
            const outgoing = currentEdges.filter((e) => e.source === removedId);
            const unrelated = currentEdges.filter(
              (e) => e.source !== removedId && e.target !== removedId,
            );

            // Reconnect: for each (source → removed) and (removed → target), create (source → target)
            const reconnected: Edge[] = [];
            for (const inc of incoming) {
              for (const out of outgoing) {
                reconnected.push({
                  id: `edge-${inc.source}-${out.target}`,
                  source: inc.source,
                  target: out.target,
                  type: 'smoothstep',
                  animated: true,
                });
              }
            }

            return [...unrelated, ...reconnected];
          });

          // Clear selection if the deleted node was selected
          if (selectedNodeId === removedId) {
            setSelectedNodeId(null);
          }
        }
      }

      // Apply default node changes (position, selection, removal)
      onNodesChange(changes);
    },
    [onNodesChange, setEdges, selectedNodeId],
  );

  // --- Update node data (called by properties panel) ---
  const handleNodeDataUpdate = useCallback(
    (nodeId: string, newData: Partial<BlockNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node,
        ),
      );
    },
    [setNodes],
  );

  // Derive selected node data for properties panel
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;
  const selectedNodeData = selectedNode?.data ?? null;
  const selectedBlockType = selectedNodeData?.blockType ?? null;

  return (
    <div ref={reactFlowWrapper} className="flex h-full w-full">
      {/* Block Palette */}
      <BlockPalette />

      {/* Canvas */}
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        selectedNodeId={selectedNodeId}
      />

      {/* Block Properties Panel */}
      <BlockProperties
        nodeData={selectedNodeData}
        blockType={selectedBlockType}
        onUpdate={(data) => {
          if (selectedNodeId) {
            handleNodeDataUpdate(selectedNodeId, data);
          }
        }}
        onClose={handlePaneClick}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export — wraps inner component with ReactFlowProvider
// ---------------------------------------------------------------------------

export function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
