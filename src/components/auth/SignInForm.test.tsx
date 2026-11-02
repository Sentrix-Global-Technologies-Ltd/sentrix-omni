import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import SignInForm from "./SignInForm";
import { errorFromStatus } from "../../services/api/errors";

const login = vi.fn();
vi.mock("../../context/AuthContext", () => ({ useAuth: () => ({ login }) }));

const SQL_LEAK =
  'SQLSTATE[42P01]: Undefined table: 7 ERROR: relation "users" does not exist (Connection: pgsql, Host: pgsql, Port: 5432, Database: sentrix, SQL: select * from "users")';

async function submitWith(rejection: unknown) {
  login.mockRejectedValueOnce(rejection);
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SignInForm />
    </MemoryRouter>,
  );
  await user.type(screen.getByPlaceholderText("you@organization.com"), "test@example.com");
  await user.type(screen.getByPlaceholderText("Enter your password"), "secret-pass");
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
}

describe("SignInForm — safe error display", () => {
  beforeEach(() => login.mockReset());

  it("invalid credentials show 'Invalid email or password.'", async () => {
    await submitWith(errorFromStatus(401, "x", {}, "invalid_credentials"));
    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
  });

  it("a backend 500 carrying SQL shows the generic message, not the exception", async () => {
    await submitWith(errorFromStatus(500, SQL_LEAK));
    expect(await screen.findByText("Something went wrong. Please try again later.")).toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE|relation|pgsql|users/i)).not.toBeInTheDocument();
  });

  it("a 503 shows the temporarily-unavailable message", async () => {
    await submitWith(errorFromStatus(503, SQL_LEAK, {}, "service_unavailable"));
    expect(
      await screen.findByText("The service is temporarily unavailable. Please try again later."),
    ).toBeInTheDocument();
  });

  it("a non-API exception (TypeError) is never echoed to the user", async () => {
    await submitWith(new TypeError("Cannot read properties of undefined (reading 'data')"));
    expect(await screen.findByText("Sign-in failed. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText(/Cannot read properties/i)).not.toBeInTheDocument();
  });
});
