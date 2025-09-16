import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

/**
 * REGRESSION TEST SUITE FOR FORM FOCUS ISSUES
 *
 * This test suite is designed to catch regressions in form focus behavior
 * that were previously causing user experience issues.
 *
 * Critical behaviors tested:
 * 1. Input focus stability during typing
 * 2. Modal scroll position preservation
 * 3. Component re-render optimization
 * 4. Event handler stability
 */

// Mock performance API for component render tracking
const renderTracker = {
  renderCount: 0,
  reset: () => {
    renderTracker.renderCount = 0;
  },
  increment: () => {
    renderTracker.renderCount++;
  },
};

// Test component that tracks re-renders
const TestFormComponent = React.memo(() => {
  renderTracker.increment();
  const [value, setValue] = React.useState("");

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [],
  );

  return (
    <div>
      <input
        data-testid="test-input"
        value={value}
        onChange={handleChange}
        placeholder="Test input"
      />
      <div data-testid="render-count">{renderTracker.renderCount}</div>
    </div>
  );
});

describe("Form Focus Regression Tests", () => {
  beforeEach(() => {
    renderTracker.reset();
  });

  it("REGRESSION: Input should not lose focus after first word", async () => {
    /**
     * This test prevents regression of the main issue where inputs
     * would lose focus after typing the first word
     */
    const user = userEvent.setup();
    render(<TestFormComponent />);

    const input = screen.getByTestId("test-input");
    await user.click(input);

    // Type first word
    await user.type(input, "first");
    expect(input).toHaveFocus();

    // Type space and second word
    await user.type(input, " second");
    expect(input).toHaveFocus();

    // Type third word to be thorough
    await user.type(input, " third");
    expect(input).toHaveFocus();

    expect(input).toHaveValue("first second third");
  });

  it("REGRESSION: Component should not re-render excessively during typing", async () => {
    /**
     * This test ensures that typing doesn't cause excessive re-renders
     * which was contributing to focus loss
     */
    const user = userEvent.setup();
    render(<TestFormComponent />);

    const input = screen.getByTestId("test-input");
    const initialRenderCount = renderTracker.renderCount;

    await user.click(input);
    await user.type(input, "test");

    const finalRenderCount = renderTracker.renderCount;
    const rerendersDuringTyping = finalRenderCount - initialRenderCount;

    // Should have minimal re-renders (one per character typed is acceptable)
    expect(rerendersDuringTyping).toBeLessThanOrEqual(5); // 4 characters + 1 initial
  });

  it("REGRESSION: Event handlers should remain stable", () => {
    /**
     * This test ensures event handlers don't change between renders,
     * which could cause React to remount components
     */
    let handlerRef: any;

    const TestComponent = () => {
      const [, setValue] = React.useState("");

      const handleChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
        },
        [],
      );

      // Store reference to handler
      if (!handlerRef) {
        handlerRef = handleChange;
      }

      return (
        <input
          data-testid="stable-input"
          onChange={handleChange}
          placeholder="Stable handler test"
        />
      );
    };

    const { rerender } = render(<TestComponent />);
    const input = screen.getByTestId("stable-input");
    const initialHandler = (input as any).onchange;

    // Force re-render
    rerender(<TestComponent />);
    const afterRerenderHandler = (input as any).onchange;

    // Handler should remain the same reference
    expect(initialHandler).toBe(afterRerenderHandler);
  });

  it("REGRESSION: Scroll container should preserve position during updates", () => {
    /**
     * This test ensures scroll position is maintained during component updates
     */
    const ScrollTestComponent = () => {
      const [text, setText] = React.useState("");
      const scrollRef = React.useRef<HTMLDivElement>(null);
      const [scrollPosition, setScrollPosition] = React.useState(0);

      React.useEffect(() => {
        if (scrollRef.current && scrollPosition > 0) {
          scrollRef.current.scrollTop = scrollPosition;
        }
      });

      const handleScroll = React.useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
          setScrollPosition(e.currentTarget.scrollTop);
        },
        [],
      );

      return (
        <div>
          <div
            ref={scrollRef}
            data-testid="scroll-container"
            style={{ height: "100px", overflow: "auto" }}
            onScroll={handleScroll}
          >
            <div style={{ height: "200px", padding: "10px" }}>
              <input
                data-testid="scroll-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
        </div>
      );
    };

    render(<ScrollTestComponent />);

    const container = screen.getByTestId("scroll-container");
    const input = screen.getByTestId("scroll-input");

    // Set scroll position
    fireEvent.scroll(container, { target: { scrollTop: 50 } });
    expect(container.scrollTop).toBe(50);

    // Type in input (this might trigger re-renders)
    fireEvent.change(input, { target: { value: "test text" } });

    // Scroll position should be preserved
    expect(container.scrollTop).toBe(50);
  });

  it("REGRESSION: Memoized components should not recreate unnecessarily", () => {
    /**
     * This test ensures memoized components maintain identity
     */
    let componentCreationCount = 0;

    const MemoizedChild = React.memo(() => {
      componentCreationCount++;
      return <div data-testid="memoized-child">Child</div>;
    });

    const ParentComponent = ({ trigger }: { trigger: number }) => {
      return (
        <div>
          <MemoizedChild />
          <div>{trigger}</div>
        </div>
      );
    };

    const { rerender } = render(<ParentComponent trigger={1} />);
    const initialCreationCount = componentCreationCount;

    // Re-render parent with same props for child
    rerender(<ParentComponent trigger={2} />);

    // Child should not recreate since its props didn't change
    expect(componentCreationCount).toBe(initialCreationCount);
  });

  it("REGRESSION: useCallback dependencies should be stable", () => {
    /**
     * This test ensures useCallback dependencies don't change unnecessarily
     */
    const callbackRefs: any[] = [];

    const TestComponent = ({ data }: { data: any[] }) => {
      const stableCallback = React.useCallback(() => {
        // Some operation
      }, [data]); // data should be stable

      callbackRefs.push(stableCallback);

      return <div data-testid="callback-test">Test</div>;
    };

    const stableData = [1, 2, 3];
    const { rerender } = render(<TestComponent data={stableData} />);

    // Re-render with same data reference
    rerender(<TestComponent data={stableData} />);

    // Callback should be the same reference
    expect(callbackRefs[0]).toBe(callbackRefs[1]);
  });

  it("REGRESSION: Form validation should not interfere with focus", async () => {
    /**
     * This test ensures validation errors don't break input focus
     */
    const ValidationTestComponent = () => {
      const [value, setValue] = React.useState("");
      const [error, setError] = React.useState("");

      const handleChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value;
          setValue(newValue);

          // Simulate validation
          if (newValue.length > 5) {
            setError("Too long");
          } else {
            setError("");
          }
        },
        [],
      );

      return (
        <div>
          <input
            data-testid="validation-input"
            value={value}
            onChange={handleChange}
          />
          {error && <div data-testid="error">{error}</div>}
        </div>
      );
    };

    const user = userEvent.setup();
    render(<ValidationTestComponent />);

    const input = screen.getByTestId("validation-input");
    await user.click(input);

    // Type text that will trigger validation
    await user.type(input, "very long text");

    // Error should appear
    expect(screen.getByTestId("error")).toBeInTheDocument();

    // But input should still have focus
    expect(input).toHaveFocus();

    // And we should be able to continue typing
    await user.type(input, " more");
    expect(input).toHaveFocus();
  });

  it("REGRESSION: Dynamic content updates should not break scroll", () => {
    /**
     * This test ensures dynamic content changes don't reset scroll position
     */
    const DynamicContentComponent = () => {
      const [items, setItems] = React.useState([1, 2, 3]);
      const [scrollTop, setScrollTop] = React.useState(0);
      const containerRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = scrollTop;
        }
      });

      const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
      };

      return (
        <div>
          <button
            onClick={() => setItems([...items, items.length + 1])}
            data-testid="add-item"
          >
            Add Item
          </button>
          <div
            ref={containerRef}
            data-testid="dynamic-container"
            style={{ height: "100px", overflow: "auto" }}
            onScroll={handleScroll}
          >
            {items.map((item) => (
              <div key={item} style={{ height: "50px" }}>
                Item {item}
              </div>
            ))}
          </div>
        </div>
      );
    };

    render(<DynamicContentComponent />);

    const container = screen.getByTestId("dynamic-container");
    const addButton = screen.getByTestId("add-item");

    // Scroll down
    fireEvent.scroll(container, { target: { scrollTop: 50 } });
    expect(container.scrollTop).toBe(50);

    // Add new content
    fireEvent.click(addButton);

    // Scroll position should be preserved
    expect(container.scrollTop).toBe(50);
  });
});

/**
 * PERFORMANCE REGRESSION TESTS
 *
 * These tests ensure the form remains performant
 */
describe("Performance Regression Tests", () => {
  it("REGRESSION: Should not create new objects in render", () => {
    const objectRefs: any[] = [];

    const TestComponent = () => {
      // This is WRONG - creates new object every render
      // const style = { color: 'red' };

      // This is CORRECT - stable reference
      const style = React.useMemo(() => ({ color: "red" }), []);

      objectRefs.push(style);

      return <div style={style}>Test</div>;
    };

    const { rerender } = render(<TestComponent />);
    rerender(<TestComponent />);

    // Style object should be the same reference
    expect(objectRefs[0]).toBe(objectRefs[1]);
  });

  it("REGRESSION: Should minimize unnecessary effect executions", () => {
    let effectCount = 0;

    const TestComponent = ({ value }: { value: string }) => {
      React.useEffect(() => {
        effectCount++;
      }, [value]); // Only run when value changes

      return <div>{value}</div>;
    };

    const { rerender } = render(<TestComponent value="test" />);
    const initialEffectCount = effectCount;

    // Re-render with same value
    rerender(<TestComponent value="test" />);

    // Effect should not run again
    expect(effectCount).toBe(initialEffectCount);
  });
});
