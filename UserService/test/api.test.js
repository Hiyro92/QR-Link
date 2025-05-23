const request = require("supertest");
const app = require("../server"); // Pfad zu Ihrer Express-App anpassen

const baseUrl = "http://localhost:3000"; // Basis-URL Ihrer API

// Testdaten (ggf. anpassen)
const testCompany = {
  companyName: "Test Company GmbH",
  companyAddress: "Musterstraße 1",
  companyPhone: "0123-456789",
};

const adminUser = {
  email: "admin-test@example.com", // Stellen Sie sicher, dass diese E-Mail für jeden Testlauf neu ist
  password: "securepassword123",
  firstName: "Admin",
  lastName: "Test",
};

let adminToken = "";
let adminRefreshToken = "";
let adminUserId = "";
let testCompanyId = "";
let emailVerificationToken = ""; // Muss simuliert oder aus dem E-Mail-Versand extrahiert werden
let passwordResetToken = ""; // Muss simuliert oder aus dem E-Mail-Versand extrahiert werden

// Helper function to simulate getting a token (replace with actual email parsing in a real test env)
const simulateGetVerificationToken = (responseBody) => {
  // In einer echten Testumgebung müssten Sie hier die versendete E-Mail abfangen und den Token extrahieren.
  // Für dieses Beispiel simulieren wir, dass der Token in der Antwort oder einem separaten Prozess verfügbar gemacht wird.
  // PASST DIESEN TEIL AN, um den tatsächlichen Token zu erhalten!
  console.warn(
    "WARNING: Email verification token simulation. Adapt this to get the real token."
  );
  return "simulated-email-verification-token-12345";
};

const simulateGetPasswordResetToken = (responseBody) => {
  // Ähnlich wie bei der E-Mail-Verifizierung müssten Sie den Token aus der versendeten E-Mail extrahieren.
  console.warn(
    "WARNING: Password reset token simulation. Adapt this to get the real token."
  );
  return "simulated-password-reset-token-67890";
};

describe("Authentication Endpoints", () => {
  // --- POST /api/auth/register ---
  describe("POST /api/auth/register", () => {
    it("should register a new company and admin user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          ...testCompany,
          ...adminUser,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty(
        "message",
        "Company registered successfully. Please verify your email."
      );
      expect(res.body).toHaveProperty("companyId");
      //expect(res.body.companyId).toEqual(expect.any(String)); // Optional: Validate UUID format
      testCompanyId = res.body.companyId;
      emailVerificationToken = simulateGetVerificationToken(res.body); // Simulieren Sie das Abrufen des Tokens
    });

    it("should return 400 if email is already registered", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          ...testCompany, // Verwenden Sie die gleichen Firmendaten oder andere
          ...adminUser, // Verwenden Sie die bereits registrierte E-Mail
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message"); // Oder eine spezifischere Fehlermeldung
      // Optional: expect(res.body.message).toContain('email already registered');
    });

    it("should return 422 if required fields are missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        companyName: "Incomplete Company",
        email: "incomplete@test.com",
        // password, firstName, lastName fehlen
      });

      expect(res.statusCode).toEqual(422);
      expect(res.body).toHaveProperty("errors");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("should return 422 if password is too short", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          ...testCompany,
          email: "shortpass@test.com",
          password: "short", // Weniger als 8 Zeichen
          firstName: "Short",
          lastName: "Pass",
        });

      expect(res.statusCode).toEqual(422);
      expect(res.body).toHaveProperty("errors");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
      // Optional: expect(res.body.errors[0]).toHaveProperty('password');
    });

    it("should accept registration with optional fields", async () => {
      const res = await request(app).post("/api/auth/register").send({
        companyName: "Company with Optional",
        email: "optional@test.com",
        password: "securepassword123",
        firstName: "Optional",
        lastName: "Fields",
        companyAddress: "Optional Address",
        companyPhone: "999-888-7777",
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty(
        "message",
        "Company registered successfully. Please verify your email."
      );
      expect(res.body).toHaveProperty("companyId");
      // Need a way to verify optional fields were saved (maybe via login later or a separate endpoint)
    });
  });

  // --- GET /api/auth/verify-email/:token ---
  describe("GET /api/auth/verify-email/:token", () => {
    // Stellen Sie sicher, dass ein Benutzer in den vorherigen Tests registriert wurde,
    // dessen E-Mail noch nicht verifiziert ist und Sie den verificationToken haben.
    // Dies hängt stark davon ab, wie Ihr System Tokens generiert und speichert.

    it("should verify email successfully with a valid token", async () => {
      // Sie müssen sicherstellen, dass 'emailVerificationToken' einen echten, gültigen Token enthält.
      // Im realen Test-Setup würden Sie hier den Token aus dem Registrierungstest oder einem Setup-Schritt holen.
      if (!emailVerificationToken) {
        console.warn(
          "Skipping email verification test: emailVerificationToken not available. Ensure registration test runs and captures the token."
        );
        pending(); // Markieren Sie diesen Test als ausstehend, wenn der Token nicht verfügbar ist.
      }

      const res = await request(app).get(
        `/api/auth/verify-email/${emailVerificationToken}`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Email verified successfully");
    });

    it("should return 400 for an invalid token", async () => {
      const res = await request(app).get(
        "/api/auth/verify-email/invalid-token-123"
      );

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message"); // Oder spezifischere Fehlermeldung
      // Optional: expect(res.body.message).toContain('invalid token');
    });

    it("should return 400 for an expired token", async () => {
      // Sie müssen einen Weg haben, einen abgelaufenen Token zu erhalten oder zu simulieren.
      console.warn(
        "Skipping expired token test: Requires setup for an expired token."
      );
      pending(); // Markieren Sie diesen Test als ausstehend
      // Beispiel für einen Test mit einem abgelaufenen Token:
      // const expiredToken = 'simulated-expired-token-abcde';
      // const res = await request(app).get(`/api/auth/verify-email/${expiredToken}`);
      // expect(res.statusCode).toEqual(400);
      // expect(res.body).toHaveProperty('message'); // Should indicate expired token
    });

    it("should return 400 for an already used token", async () => {
      // Sie müssen einen Weg haben, einen bereits verwendeten Token zu erhalten.
      console.warn(
        "Skipping already used token test: Requires setup for a used token."
      );
      pending(); // Markieren Sie diesen Test als ausstehend
      // Beispiel: Führen Sie den erfolgreichen Verifizierungstest zweimal aus (oder verwenden Sie einen Token, der bereits verwendet wurde)
      // const usedToken = 'simulated-used-token-fghij'; // Ein Token, der bereits erfolgreich verwendet wurde
      // const res = await request(app).get(`/api/auth/verify-email/${usedToken}`);
      // expect(res.statusCode).toEqual(400);
      // expect(res.body).toHaveProperty('message'); // Should indicate already used token
    });
  });

  // --- POST /api/auth/login ---
  describe("POST /api/auth/login", () => {
    // Stellen Sie sicher, dass der Benutzer (adminUser) registriert und seine E-Mail verifiziert ist, bevor diese Tests laufen.

    it("should login successfully with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: adminUser.email,
        password: adminUser.password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Login successful");
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user).toHaveProperty("email", adminUser.email);
      expect(res.body.user).toHaveProperty("company");
      adminToken = res.body.token;
      adminRefreshToken = res.body.refreshToken;
      adminUserId = res.body.user.id;
    });

    it("should return 401 for invalid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: adminUser.email,
        password: "wrongpassword",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("message"); // Should indicate invalid credentials
    });

    it("should return 401 if email is not verified", async () => {
      // Sie müssen einen Benutzer registrieren, dessen E-Mail NICHT verifiziert wird.
      console.warn(
        "Skipping unverified email login test: Requires setup for unverified user."
      );
      pending(); // Markieren Sie diesen Test als ausstehend
      // Beispiel:
      // const unverifiedUser = { email: 'unverified@test.com', password: 'password123' };
      // // Registrieren Sie diesen Benutzer, aber überspringen Sie die Verifizierung
      // const res = await request(app).post('/api/auth/login').send(unverifiedUser);
      // expect(res.statusCode).toEqual(401);
      // expect(res.body).toHaveProperty('message'); // Should indicate email not verified
    });

    it("should return 401 if account is inactive", async () => {
      // Sie müssen einen Benutzer haben, dessen Account auf inaktiv gesetzt wurde.
      console.warn(
        "Skipping inactive account login test: Requires setup for inactive user."
      );
      pending(); // Markieren Sie diesen Test als ausstehend
      // Beispiel:
      // const inactiveUser = { email: 'inactive@test.com', password: 'password123' };
      // // Registrieren und aktivieren Sie diesen Benutzer, setzen Sie ihn dann auf inaktiv (über ein Admin-Endpoint?)
      // const res = await request(app).post('/api/auth/login').send(inactiveUser);
      // expect(res.statusCode).toEqual(401);
      // expect(res.body).toHaveProperty('message'); // Should indicate inactive account
    });

    it("should return 401 if account is locked", async () => {
      // Sie müssen einen Weg haben, einen Account zu sperren (z.B. durch zu viele fehlgeschlagene Login-Versuche).
      console.warn(
        "Skipping locked account login test: Requires setup for locked user."
      );
      pending(); // Markieren Sie diesen Test als ausstehend
      // Beispiel:
      // const lockedUser = { email: 'locked@test.com', password: 'password123' };
      // // Trigger locked status for this user (e.g., multiple failed logins)
      // const res = await request(app).post('/api/auth/login').send(lockedUser);
      // expect(res.statusCode).toEqual(401);
      // expect(res.body).toHaveProperty('message'); // Should indicate locked account
    });

    it("should return 422 if email or password is missing", async () => {
      const res1 = await request(app).post("/api/auth/login").send({
        password: adminUser.password,
      });
      expect(res1.statusCode).toEqual(422);
      expect(res1.body).toHaveProperty("errors");

      const res2 = await request(app).post("/api/auth/login").send({
        email: adminUser.email,
      });
      expect(res2.statusCode).toEqual(422);
      expect(res2.body).toHaveProperty("errors");
    });
  });

  // --- POST /api/auth/refresh-token ---
  describe("POST /api/auth/refresh-token", () => {
    // Stellen Sie sicher, dass adminRefreshToken aus dem erfolgreichen Login-Test verfügbar ist.

    it("should refresh token successfully with a valid refresh token", async () => {
      if (!adminRefreshToken) {
        console.warn(
          "Skipping refresh token test: adminRefreshToken not available. Ensure login test runs and captures the token."
        );
        pending(); // Markieren Sie diesen Test als ausstehend
      }

      const res = await request(app).post("/api/auth/refresh-token").send({
        refreshToken: adminRefreshToken,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("refreshToken");
      adminToken = res.body.token; // Update token for subsequent tests
      adminRefreshToken = res.body.refreshToken; // Update refresh token
    });

    it("should return 400 if refresh token is missing", async () => {
      const res = await request(app).post("/api/auth/refresh-token").send({}); // Leerer Body

      expect(res.statusCode).toEqual(400); // Laut Doku: 400 Bad Request
      expect(res.body).toHaveProperty("message"); // Should indicate missing token
    });

    it("should return 401 for an invalid refresh token", async () => {
      const res = await request(app).post("/api/auth/refresh-token").send({
        refreshToken: "invalid-refresh-token-123",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("message"); // Should indicate invalid token
    });

    it("should return 401 for an expired refresh token", async () => {
      // Sie müssen einen Weg haben, einen abgelaufenen Refresh Token zu erhalten oder zu simulieren.
      console.warn(
        "Skipping expired refresh token test: Requires setup for an expired refresh token."
      );
      pending(); // Markieren Sie diesen Test als ausstehend
      // Beispiel:
      // const expiredRefreshToken = 'simulated-expired-refresh-token-abcde';
      // const res = await request(app).post('/api/auth/refresh-token').send({ refreshToken: expiredRefreshToken });
      // expect(res.statusCode).toEqual(401);
      // expect(res.body).toHaveProperty('message'); // Should indicate expired token
    });

    it("should return 401 if account is inactive during refresh", async () => {
      // Sie müssen einen Benutzer haben, dessen Account auf inaktiv gesetzt wurde, und dessen Refresh Token noch gültig ist.
      console.warn(
        "Skipping inactive account refresh test: Requires setup for inactive user with valid refresh token."
      );
      pending(); // Markieren Sie diesen Test als ausstehend
      // Beispiel:
      // // Make user inactive after getting their refresh token
      // const inactiveUserRefreshToken = 'refresh-token-of-inactive-user';
      // const res = await request(app).post('/api/auth/refresh-token').send({ refreshToken: inactiveUserRefreshToken });
      // expect(res.statusCode).toEqual(401);
      // expect(res.body).toHaveProperty('message'); // Should indicate inactive account
    });
  });

  // --- POST /api/auth/forgot-password ---
  describe("POST /api/auth/forgot-password", () => {
    it("should return 200 for an existing email and initiate reset (simulated)", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({
        email: adminUser.email,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty(
        "message",
        "If that email exists in our system, we have sent a password reset link"
      );
      // In a real test, you'd verify an email was sent here.
      passwordResetToken = simulateGetPasswordResetToken(res.body); // Simulieren Sie das Abrufen des Tokens
    });

    it("should return 200 for a non-existent email (security feature)", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({
        email: "nonexistent@example.com",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty(
        "message",
        "If that email exists in our system, we have sent a password reset link"
      );
      // In a real test, you'd verify NO email was sent here.
    });

    it("should return 422 for invalid email format", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({
        email: "invalid-email-format",
      });

      expect(res.statusCode).toEqual(422);
      expect(res.body).toHaveProperty("errors");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("should return 422 if email is missing", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({});

      expect(res.statusCode).toEqual(422);
      expect(res.body).toHaveProperty("errors");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  // --- POST /api/auth/reset-password ---
  describe("POST /api/auth/reset-password", () => {
    // Stellen Sie sicher, dass passwordResetToken aus dem forgot-password Test verfügbar ist.

    it("should reset password successfully with a valid token", async () => {
      if (!passwordResetToken) {
        console.warn(
          "Skipping password reset test: passwordResetToken not available. Ensure forgot-password test runs and captures the token."
        );
        pending(); // Markieren Sie diesen Test als ausstehend
      }

      const newPassword = "newSecurePassword456";
      const res = await request(app).post("/api/auth/reset-password").send({
        token: passwordResetToken,
        password: newPassword,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty(
        "message",
        "Password has been reset successfully"
      );

      // Verify login with new password
      const loginRes = await request(app).post("/api/auth/login").send({
        email: adminUser.email,
        password: newPassword,
      });
      expect(loginRes.statusCode).toEqual(200);
      // Update adminUser password for potential later tests (though better to re-login)
      adminUser.password = newPassword;
    });

    it("should return 400 for an invalid token", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({
        token: "invalid-reset-token-123",
        password: "somepassword",
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message"); // Should indicate invalid token
    });

    it("should return 400 for an expired token", async () => {
      // Sie müssen einen Weg haben, einen abgelaufenen Reset Token zu erhalten oder zu simulieren.
      console.warn(
        "Skipping expired reset token test: Requires setup for an expired reset token."
      );
      pending(); // Markieren Sie diesen Test als ausstehend
      // Beispiel:
      // const expiredResetToken = 'simulated-expired-reset-token-abcde';
      // const res = await request(app).post('/api/auth/reset-password').send({ token: expiredResetToken, password: 'newpassword' });
      // expect(res.statusCode).toEqual(400);
      // expect(res.body).toHaveProperty('message'); // Should indicate expired token
    });

    it("should return 422 if token or password is missing", async () => {
      const res1 = await request(app).post("/api/auth/reset-password").send({
        password: "somepassword",
      });
      expect(res1.statusCode).toEqual(422);
      expect(res1.body).toHaveProperty("errors");

      const res2 = await request(app).post("/api/auth/reset-password").send({
        token: "some-token",
      });
      expect(res2.statusCode).toEqual(422);
      expect(res2.body).toHaveProperty("errors");
    });

    it("should return 422 if new password is too short", async () => {
      if (!passwordResetToken) {
        console.warn(
          "Skipping password reset (short password) test: passwordResetToken not available."
        );
        pending();
      }
      const res = await request(app).post("/api/auth/reset-password").send({
        token: passwordResetToken,
        password: "short", // Weniger als 8 Zeichen
      });

      expect(res.statusCode).toEqual(422);
      expect(res.body).toHaveProperty("errors");
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
      // Optional: expect(res.body.errors[0]).toHaveProperty('password');
    });
  });

  // --- POST /api/auth/logout ---
  describe("POST /api/auth/logout", () => {
    // Stellen Sie sicher, dass adminToken aus einem erfolgreichen Login oder Refresh verfügbar ist.

    it("should logout successfully with a valid token", async () => {
      if (!adminToken) {
        console.warn(
          "Skipping logout test: adminToken not available. Ensure login/refresh tests run."
        );
        pending(); // Markieren Sie diesen Test als ausstehend
      }

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Logged out successfully");

      // Verify the token is invalidated (subsequent requests should fail)
      const failedAuthRes = await request(app)
        .get("/api/users/me") // Any protected endpoint
        .set("Authorization", `Bearer ${adminToken}`);
      expect(failedAuthRes.statusCode).toEqual(401); // Should fail after logout
    });

    it("should return 401 if no token is provided", async () => {
      const res = await request(app).post("/api/auth/logout"); // No Authorization header

      expect(res.statusCode).toEqual(401);
    });

    it("should return 401 if an invalid token is provided", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer invalid-token`);

      expect(res.statusCode).toEqual(401);
    });
  });
});
