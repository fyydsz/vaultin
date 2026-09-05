import { expect, describe, it } from "bun:test";
import { validateEmail, validateUsername, validatePassword } from "../validation";

describe("Auth Validation Unit Tests", () => {
  describe("validateEmail", () => {
    it("validates correct email addresses", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("first.last@company.co.id")).toBe(true);
      expect(validateEmail("name+tag@sub.domain.org")).toBe(true);
    });

    it("rejects invalid email formats", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("plainaddress")).toBe(false);
      expect(validateEmail("@missinguser.com")).toBe(false);
      expect(validateEmail("user@missingtld.")).toBe(false);
    });
  });

  describe("validateUsername", () => {
    it("validates alphanumeric usernames with dots and underscores", () => {
      expect(validateUsername("john_doe").isValid).toBe(true);
      expect(validateUsername("jane.doe123").isValid).toBe(true);
      expect(validateUsername("admin_99").isValid).toBe(true);
    });

    it("rejects usernames shorter than 3 characters", () => {
      const res = validateUsername("ab");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("at least 3 characters");
    });

    it("rejects usernames with illegal characters", () => {
      const res = validateUsername("john doe!");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("only contain alphanumeric characters");
    });
  });

  describe("validatePassword", () => {
    it("accepts passwords with 8 or more characters", () => {
      expect(validatePassword("secret123").isValid).toBe(true);
      expect(validatePassword("12345678").isValid).toBe(true);
    });

    it("rejects passwords under 8 characters", () => {
      const res = validatePassword("1234567");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("at least 8 characters");
    });
  });
});
