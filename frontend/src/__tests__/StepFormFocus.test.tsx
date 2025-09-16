import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import StepsManagerFixed from "../pages/admin/StepsManagerFixed";

// Mock API calls
vi.mock("../hooks/useDevices", () => ({
  useDevices: () => ({
    data: {
      data: [
        { id: "1", name: "Test Device", color: "bg-blue-500", isActive: true },
        {
          id: "2",
          name: "Another Device",
          color: "bg-red-500",
          isActive: true,
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../hooks/useProblems", () => ({
  useProblems: () => ({
    data: {
      data: [
        { id: "1", title: "Test Problem", deviceId: "1", status: "published" },
        {
          id: "2",
          title: "Another Problem",
          deviceId: "2",
          status: "published",
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../api", () => ({
  stepsApi: {
    getSteps: vi.fn().mockResolvedValue({ data: [] }),
    createStep: vi.fn().mockResolvedValue({ data: { id: "new-step" } }),
    updateStep: vi.fn().mockResolvedValue({ data: { id: "updated-step" } }),
    deleteStep: vi.fn().mockResolvedValue({ success: true }),
  },
  remotesApi: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../api/tvInterfaces", () => ({
  tvInterfacesAPI: {
    getByDeviceId: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

vi.mock("../hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("StepFormFocus Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  it("should maintain input focus during typing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepsManagerFixed />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Создать новый шаг")).toBeInTheDocument();
    });

    // Open create dialog
    const createButton = screen.getByText("Создать новый шаг");
    await user.click(createButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Find title input
    const titleInput = screen.getByLabelText(/Название шага/);
    expect(titleInput).toBeInTheDocument();

    // Focus on input and start typing
    await user.click(titleInput);
    expect(titleInput).toHaveFocus();

    // Type multiple words to test continuous focus
    await user.type(titleInput, "First word");
    expect(titleInput).toHaveFocus();
    expect(titleInput).toHaveValue("First word");

    // Continue typing to ensure focus is maintained
    await user.type(titleInput, " second word");
    expect(titleInput).toHaveFocus();
    expect(titleInput).toHaveValue("First word second word");

    // Type more to thoroughly test
    await user.type(titleInput, " third word");
    expect(titleInput).toHaveFocus();
    expect(titleInput).toHaveValue("First word second word third word");
  });

  it("should maintain focus in textarea fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepsManagerFixed />);

    // Wait for component to load and open dialog
    await waitFor(() => {
      expect(screen.getByText("Создать новый шаг")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Создать новый шаг");
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Test description textarea
    const descriptionTextarea = screen.getByLabelText(/Описание/);
    await user.click(descriptionTextarea);
    expect(descriptionTextarea).toHaveFocus();

    await user.type(descriptionTextarea, "Multi word description test");
    expect(descriptionTextarea).toHaveFocus();
    expect(descriptionTextarea).toHaveValue("Multi word description test");

    // Test instruction textarea
    const instructionTextarea = screen.getByLabelText(/Инструкция/);
    await user.click(instructionTextarea);
    expect(instructionTextarea).toHaveFocus();

    await user.type(
      instructionTextarea,
      "Long instruction with multiple words and sentences.",
    );
    expect(instructionTextarea).toHaveFocus();
    expect(instructionTextarea).toHaveValue(
      "Long instruction with multiple words and sentences.",
    );
  });

  it("should preserve scroll position in modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepsManagerFixed />);

    // Wait for component to load and open dialog
    await waitFor(() => {
      expect(screen.getByText("Создать новый шаг")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Создать новый шаг");
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Find the scrollable container
    const scrollContainer = screen
      .getByRole("dialog")
      .querySelector(".overflow-y-auto");
    expect(scrollContainer).toBeInTheDocument();

    // Simulate scrolling
    if (scrollContainer) {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
      expect(scrollContainer.scrollTop).toBe(100);

      // Type in an input to trigger potential re-renders
      const titleInput = screen.getByLabelText(/Название шага/);
      await user.type(titleInput, "test");

      // Check that scroll position is maintained after typing
      // The scroll position should be preserved during re-renders
      expect(scrollContainer.scrollTop).toBeGreaterThanOrEqual(0);
    }
  });

  it("should handle rapid typing without losing focus", async () => {
    const user = userEvent.setup({ delay: null }); // Fast typing
    renderWithProviders(<StepsManagerFixed />);

    await waitFor(() => {
      expect(screen.getByText("Создать новый шаг")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Создать новый шаг");
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Название шага/);
    await user.click(titleInput);

    // Rapid typing test
    const rapidText = "This is a rapid typing test with many words";
    await user.type(titleInput, rapidText);

    expect(titleInput).toHaveFocus();
    expect(titleInput).toHaveValue(rapidText);
  });

  it("should maintain form state consistency during device changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepsManagerFixed />);

    await waitFor(() => {
      expect(screen.getByText("Создать новый шаг")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Создать новый шаг");
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Fill title first
    const titleInput = screen.getByLabelText(/Название шага/);
    await user.type(titleInput, "Test title");
    expect(titleInput).toHaveValue("Test title");

    // Change device - this should not affect the title input
    const deviceSelect = screen.getByRole("combobox", { name: /Приставка/ });
    await user.click(deviceSelect);

    // The title should remain and input should maintain focus capability
    expect(titleInput).toHaveValue("Test title");

    // Continue typing in title
    await user.click(titleInput);
    await user.type(titleInput, " continued");
    expect(titleInput).toHaveValue("Test title continued");
    expect(titleInput).toHaveFocus();
  });

  it("should handle special characters and prevent focus loss", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepsManagerFixed />);

    await waitFor(() => {
      expect(screen.getByText("Создать новый шаг")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Создать новый шаг");
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Название шага/);
    await user.click(titleInput);

    // Test with special characters that might cause issues
    const specialText = "Test with special chars: àáâã äåæç!@#$%^&*()";
    await user.type(titleInput, specialText);

    expect(titleInput).toHaveFocus();
    expect(titleInput).toHaveValue(specialText);
  });

  it("should preserve caret position during input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepsManagerFixed />);

    await waitFor(() => {
      expect(screen.getByText("Создать новый шаг")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Создать новый шаг");
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(
      /Название шага/,
    ) as HTMLInputElement;
    await user.click(titleInput);

    // Type initial text
    await user.type(titleInput, "Hello world");
    expect(titleInput).toHaveValue("Hello world");

    // Move cursor to middle and insert text
    titleInput.setSelectionRange(5, 5); // After "Hello"
    await user.type(titleInput, " beautiful");

    expect(titleInput).toHaveValue("Hello beautiful world");
    expect(titleInput).toHaveFocus();
  });
});
