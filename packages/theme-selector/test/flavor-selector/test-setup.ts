/**
 * Shared test setup for flavor-selector tests.
 * Provides common imports, mock setup, and helper functions.
 */
import { vi } from 'vitest';
import {
  setupDocumentMocks,
  createMockElement,
  createMockDropdownContainer,
  createMockAbortController,
} from '../../../../test/helpers/mocks.js';

export {
  setupDocumentMocks,
  createMockElement,
  createMockDropdownContainer,
  createMockAbortController,
};

export { wireFlavorSelector } from '../../src/index.js';

// ============================================================================
// Typed mock shapes
// ============================================================================

/**
 * Typed shape of the mock button created by createTrackedButton.
 */
export interface MockButton {
  type: string;
  className: string;
  setAttribute: ReturnType<typeof vi.fn>;
  getAttribute: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  appendChild: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  click: ReturnType<typeof vi.fn>;
  classList: {
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    contains: ReturnType<typeof vi.fn>;
  };
}

/**
 * Typed shape of the mock link element yielded to linkHandler callbacks.
 * The onload property uses a getter/setter internally; this interface
 * describes the observable surface that linkHandler consumers interact with.
 */
export interface MockLinkEl {
  id: string;
  rel: string;
  type: string;
  href: string;
  setAttribute: ReturnType<typeof vi.fn>;
  readonly onload: (() => void) | null;
}

/**
 * Creates a tracked button element for testing.
 * Returns button and tracks it in the provided array.
 */
export const createTrackedButton = (
  createdButtons: MockButton[],
  themeIdOverride?: string
): MockButton => {
  let themeId = themeIdOverride ?? `theme-${createdButtons.length}`;
  const btn: MockButton = {
    type: '',
    className: '',
    setAttribute: vi.fn((attr: string, value: string) => {
      if (attr === 'data-theme-id') {
        themeId = value;
      }
    }),
    getAttribute: vi.fn((attr: string) => {
      if (attr === 'data-theme-id') {
        return themeId;
      }
      return null;
    }),
    addEventListener: vi.fn(),
    appendChild: vi.fn(),
    focus: vi.fn(),
    click: vi.fn(),
    classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn() },
  };
  createdButtons.push(btn);
  return btn;
};

/**
 * Creates a mock dropdown element with standard methods.
 */
export const createMockDropdownElement = (isActive = false) => ({
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn(() => isActive),
  },
  appendChild: vi.fn(),
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  contains: vi.fn(() => false),
});

/**
 * Creates a mock trigger element connected to a dropdown.
 */
export const createMockTriggerElement = (
  mocks: ReturnType<typeof setupDocumentMocks>,
  mockDropdown: ReturnType<typeof createMockDropdownElement>
) => ({
  ...mocks.mockElement,
  addEventListener: vi.fn(),
  closest: vi.fn(() => mockDropdown),
  focus: vi.fn(),
});

/**
 * Creates a standard createElement mock for tracking elements.
 */
export const createElementMock = (
  createdButtons: MockButton[],
  mocks: ReturnType<typeof setupDocumentMocks>,
  options?: {
    themeIdOverride?: string;
    linkHandler?: (link: MockLinkEl) => void;
  }
) => {
  return vi.fn((tag: string) => {
    if (tag === 'button') {
      return createTrackedButton(createdButtons, options?.themeIdOverride);
    }
    if (tag === 'link') {
      let onloadHandler: (() => void) | null = null;
      const link = {
        id: '',
        rel: '',
        type: '',
        href: '',
        setAttribute: vi.fn(),
        set onload(handler: () => void) {
          onloadHandler = handler;
          setTimeout(() => onloadHandler?.(), 0);
        },
        get onload(): (() => void) | null {
          return onloadHandler;
        },
      };
      // as unknown as MockLinkEl: the getter/setter pair exposes a compatible
      // read-only surface; narrowing through unknown avoids an unjustified any cast.
      options?.linkHandler?.(link as unknown as MockLinkEl);
      return link;
    }
    if (tag === 'div') {
      return {
        className: '',
        style: { setProperty: vi.fn() },
        appendChild: vi.fn(),
        setAttribute: vi.fn(),
      };
    }
    if (tag === 'span') {
      return { textContent: '', className: '', appendChild: vi.fn(), setAttribute: vi.fn() };
    }
    if (tag === 'img') {
      return { src: '', alt: '', width: 0, height: 0 };
    }
    if (tag === 'option') {
      return { value: '', textContent: '', selected: false };
    }
    return mocks.mockElement;
  });
};

// ============================================================================
// Keyboard Navigation Test Factory
// ============================================================================

/**
 * Context returned by setupKeyboardNavTest for use in test assertions.
 */
export interface KeyboardNavTestContext {
  /** Array of created theme buttons */
  createdButtons: MockButton[];
  /** Mock dropdown element */
  mockDropdown: ReturnType<typeof createMockDropdownElement>;
  /** Mock trigger element */
  mockTrigger: ReturnType<typeof createMockTriggerElement>;
  /** Base mocks from setupDocumentMocks */
  mocks: ReturnType<typeof setupDocumentMocks>;
  /**
   * Fire a keydown event on the trigger element.
   * Returns the event's preventDefault mock for assertions.
   */
  fireKeydown: (key: string) => { preventDefault: ReturnType<typeof vi.fn> };
  /**
   * Get the keydown handler registered on the trigger.
   * Returns undefined if no handler was registered.
   */
  getKeydownHandler: () => ((event: KeyboardEvent) => void) | undefined;
}

/**
 * Options for configuring keyboard navigation test setup.
 */
export interface KeyboardNavTestOptions {
  /** Whether the dropdown starts in the active/open state */
  dropdownActive?: boolean;
  /** Override theme ID for created buttons */
  themeIdOverride?: string;
  /** Custom link handler callback */
  linkHandler?: (link: MockLinkEl) => void;
}

/**
 * Consolidated setup for keyboard navigation tests.
 *
 * Reduces duplicated mock setup across keyboard-nav.test.ts tests
 * to a single function call with a clean API.
 *
 * @example
 * ```typescript
 * it('handles ArrowDown key navigation', () => {
 *   const ctx = setupKeyboardNavTest();
 *   wireFlavorSelector(document, window);
 *
 *   const { preventDefault } = ctx.fireKeydown('ArrowDown');
 *   expect(preventDefault).toHaveBeenCalled();
 *   expect(ctx.createdButtons[0].focus).toHaveBeenCalled();
 * });
 * ```
 *
 * @param baseMocks - Optional pre-configured mocks from setupDocumentMocks
 * @param options - Configuration options for the test setup
 * @returns Context object with all mocks and helper functions
 */
export function setupKeyboardNavTest(
  baseMocks?: ReturnType<typeof setupDocumentMocks>,
  options: KeyboardNavTestOptions = {}
): KeyboardNavTestContext {
  const mocks = baseMocks ?? setupDocumentMocks();
  const createdButtons: MockButton[] = [];
  const mockDropdown = createMockDropdownElement(options.dropdownActive ?? false);
  const mockTrigger = createMockTriggerElement(mocks, mockDropdown);

  // Setup getElementById mock
  Object.defineProperty(document, 'getElementById', {
    value: vi.fn((id) => {
      if (id === 'theme-flavor-menu') return mockDropdown;
      if (id === 'theme-flavor-trigger') return mockTrigger;
      return null;
    }),
    writable: true,
  });

  // Setup createElement mock
  Object.defineProperty(document, 'createElement', {
    value: createElementMock(createdButtons, mocks, {
      themeIdOverride: options.themeIdOverride,
      linkHandler: options.linkHandler,
    }),
    writable: true,
  });

  // Helper to get the keydown handler
  const getKeydownHandler = (): ((event: KeyboardEvent) => void) | undefined => {
    const calls = mockTrigger.addEventListener.mock.calls as [string, ...unknown[]][];
    return calls.find((c) => c[0] === 'keydown')?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;
  };

  // Helper to fire keydown events
  const fireKeydown = (key: string): { preventDefault: ReturnType<typeof vi.fn> } => {
    const handler = getKeydownHandler();
    const preventDefault = vi.fn();
    if (handler) {
      handler({ key, preventDefault } as unknown as KeyboardEvent);
    }
    return { preventDefault };
  };

  return {
    createdButtons,
    mockDropdown,
    mockTrigger,
    mocks,
    fireKeydown,
    getKeydownHandler,
  };
}
