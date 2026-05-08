import React from "react";
import { render, screen, act } from "@testing-library/react";
import { GameProvider, useGame } from "../app/context/GameContext";

function GameDisplay() {
  const { state, addGold, buyTool } = useGame();
  return (
    <div>
      <span data-testid="gold">{state.gold}</span>
      <span data-testid="bronzeAxe">{String(state.tools.bronzeAxe)}</span>
      <span data-testid="ironAxe">{String(state.tools.ironAxe)}</span>
      <button onClick={() => addGold(500)}>Add 500g</button>
      <button onClick={() => buyTool("bronzeAxe")}>Buy Bronze Axe</button>
      <button onClick={() => buyTool("ironAxe")}>Buy Iron Axe</button>
    </div>
  );
}

function renderGame() {
  return render(
    <GameProvider>
      <GameDisplay />
    </GameProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("addGold", () => {
  it("increases gold by the given amount", async () => {
    renderGame();

    await act(async () => {
      screen.getByRole("button", { name: /Add 500g/ }).click();
    });

    expect(screen.getByTestId("gold").textContent).toBe("500");
  });

  it("can be called multiple times and accumulates", async () => {
    renderGame();

    await act(async () => {
      screen.getByRole("button", { name: /Add 500g/ }).click();
      screen.getByRole("button", { name: /Add 500g/ }).click();
    });

    expect(screen.getByTestId("gold").textContent).toBe("1000");
  });
});

describe("buyTool", () => {
  it("buys a tool and deducts gold when the player can afford it", async () => {
    renderGame();

    await act(async () => {
      screen.getByRole("button", { name: /Add 500g/ }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: /Buy Bronze Axe/ }).click();
    });

    expect(screen.getByTestId("gold").textContent).toBe("300");
    expect(screen.getByTestId("bronzeAxe").textContent).toBe("true");
  });

  it("cannot buy a tool without enough gold (negative case)", async () => {
    renderGame();

    await act(async () => {
      screen.getByRole("button", { name: /Buy Bronze Axe/ }).click();
    });

    expect(screen.getByTestId("gold").textContent).toBe("0");
    expect(screen.getByTestId("bronzeAxe").textContent).toBe("false");
  });

  it("cannot buy the same tool twice", async () => {
    renderGame();

    await act(async () => {
      screen.getByRole("button", { name: /Add 500g/ }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: /Buy Bronze Axe/ }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: /Buy Bronze Axe/ }).click();
    });

    expect(screen.getByTestId("gold").textContent).toBe("300");
  });

  it("cannot buy Iron Axe (1000g) with 500g", async () => {
    renderGame();

    await act(async () => {
      screen.getByRole("button", { name: /Add 500g/ }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: /Buy Iron Axe/ }).click();
    });

    expect(screen.getByTestId("ironAxe").textContent).toBe("false");
    expect(screen.getByTestId("gold").textContent).toBe("500");
  });
});

describe("localStorage persistence", () => {
  it("saves gold to localStorage when state updates", async () => {
    renderGame();

    await act(async () => {
      screen.getByRole("button", { name: /Add 500g/ }).click();
    });

    expect(localStorage.getItem("gold")).toBe("500");
  });
});
