// =============================================================================
// FlowBuilder - Block Type Definitions Registry
// Single source of truth for all 7 block types: icons, colors, and fields.
// =============================================================================

import { BlockTypeDefinition } from './types';

export const BLOCK_TYPES: BlockTypeDefinition[] = [
  {
    type: 'click',
    label: 'Click',
    icon: 'MousePointerClick',
    color: 'bg-blue-500',
    fields: [
      {
        key: 'selector',
        label: 'CSS Selector',
        type: 'text',
        placeholder: '.btn-submit',
        required: true,
      },
    ],
  },
  {
    type: 'fill',
    label: 'Fill Input',
    icon: 'TextCursorInput',
    color: 'bg-green-500',
    fields: [
      {
        key: 'selector',
        label: 'CSS Selector',
        type: 'text',
        placeholder: '#email-input',
        required: true,
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        placeholder: 'test@example.com',
        required: true,
      },
    ],
  },
  {
    type: 'waitFor',
    label: 'Wait For',
    icon: 'Clock',
    color: 'bg-yellow-500',
    fields: [
      {
        key: 'selector',
        label: 'CSS Selector',
        type: 'text',
        placeholder: '.loading-complete',
        required: true,
      },
    ],
  },
  {
    type: 'assertText',
    label: 'Assert Text',
    icon: 'CheckCircle',
    color: 'bg-purple-500',
    fields: [
      {
        key: 'selector',
        label: 'CSS Selector',
        type: 'text',
        placeholder: 'h1.title',
        required: true,
      },
      {
        key: 'expected',
        label: 'Expected Text',
        type: 'text',
        placeholder: 'Welcome',
        required: true,
      },
    ],
  },
  {
    type: 'navigate',
    label: 'Navigate',
    icon: 'Globe',
    color: 'bg-cyan-500',
    fields: [
      {
        key: 'url',
        label: 'URL',
        type: 'text',
        placeholder: 'https://example.com/page',
        required: true,
      },
    ],
  },
  {
    type: 'login',
    label: 'Login',
    icon: 'LogIn',
    color: 'bg-orange-500',
    fields: [
      {
        key: 'email',
        label: 'Email',
        type: 'text',
        placeholder: 'user@example.com',
        required: true,
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        placeholder: '••••••••',
        required: true,
      },
    ],
  },
  {
    type: 'logout',
    label: 'Logout',
    icon: 'LogOut',
    color: 'bg-red-500',
    fields: [
      {
        key: 'selector',
        label: 'Logout Button Selector',
        type: 'text',
        placeholder: '.logout-btn',
        required: false,
      },
    ],
  },
];

/** Lookup map for fast block type definition retrieval by type key */
export const BLOCK_TYPE_MAP = new Map(
  BLOCK_TYPES.map((definition) => [definition.type, definition])
);
