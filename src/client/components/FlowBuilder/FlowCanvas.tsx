// =============================================================================
// FlowCanvas — React Flow canvas with dark-themed background, controls, and
// minimap. Receives all state and callbacks from the parent FlowBuilder.
// =============================================================================

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BlockNode } from './BlockNode';
import type { BlockNodeData } from './types';

// ---------------------------------------------------------------------------
// nodeTypes must be defined OUTSIDE the component to prevent React Flow
// from re-mounting all nodes on every render.
// ---------------------------------------------------------------------------

const nodeTypes = { block: BlockNode } as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FlowCanvasProps {
  nodes: Node<BlockNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<BlockNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: (event: React.MouseEvent, node: Node<BlockNodeData>) => void;
  onPaneClick: () => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  selectedNodeId: string | null;
}

// ---------------------------------------------------------------------------
// FlowCanvas
// ---------------------------------------------------------------------------

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onDrop,
  onDragOver,
  selectedNodeId,
}: FlowCanvasProps) {
  // Highlight selected node via class injection
  const getNodeClassName = useCallback(
    (node: Node) => (node.id === selectedNodeId ? 'selected' : ''),
    [selectedNodeId],
  );

  return (
    <div className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        snapToGrid
        snapGrid={[16, 16]}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        colorMode="dark"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3e3e42', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#3e3e42"
        />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!bg-surface-raised !border-border !shadow-lg [&>button]:!bg-surface-raised [&>button]:!border-border [&>button]:!fill-text-secondary [&>button:hover]:!bg-surface-overlay"
        />
        <MiniMap
          position="bottom-right"
          nodeColor="#3e3e42"
          maskColor="rgba(30, 30, 30, 0.8)"
          className="!bg-surface !border-border !shadow-lg"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
