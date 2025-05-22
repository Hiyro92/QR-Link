import React, { useState, useContext, createContext } from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Link,
    Navigate,
} from "react-router";

// Kontext für den Authentifizierungsstatus
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("jwt_token"));
    const [refreshToken, setRefreshToken] = useState(
        localStorage.getItem("refresh_token")
    );
    const [isAuthenticated, setIsAuthenticated] = useState(!!token);

    const login = (newToken, newRefreshToken) => {
        localStorage.setItem("jwt_token", newToken);
        localStorage.setItem("refresh_token", newRefreshToken);
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setIsAuthenticated(true);
    };

    const logout = () => {
        // Optional: API-Logout-Endpunkt aufrufen, um den Refresh-Token serverseitig zu invalidieren
        // Für dieses MVP überspringen wir den API-Aufruf und löschen nur die Tokens lokal.
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("refresh_token");
        setToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
    };

    // Dummy refresh-Token Funktion (nicht Teil des MVP-Flows im UI, aber nützlich)
    const refreshAuthToken = async () => {
        const currentRefreshToken = localStorage.getItem("refresh_token");
        if (!currentRefreshToken) {
            logout(); // Kann nicht aktualisieren, Token abgelaufen oder fehlt
            return false;
        }
        try {
            const response = await apiClient("/auth/refresh-token", "POST", {
                refreshToken: currentRefreshToken,
            });
            login(response.token, response.refreshToken); // Neue Tokens speichern
            return true;
        } catch (error) {
            console.error("Failed to refresh token:", error);
            logout(); // Aktualisierung fehlgeschlagen, Benutzer abmelden
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                refreshToken,
                isAuthenticated,
                login,
                logout,
                refreshAuthToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Farben aus dem Designsystem (mithilfe von Inline-Stilen für präzise Übereinstimmung)
const colors = {
    primary: "#4A90E2", // Trust
    secondary: "#D0E6F1", // Calm
    accent: "#F5A623", // Attention
    background: "#FFFFFF", // Clean
    text: "#333333", // Readability
    success: "#10B981", // Grün
    error: "#EF4444", // Rot
};

// --- API Client ---
const API_BASE_URL = "http://localhost:3000/api";

const apiClient = async (
    endpoint,
    method = "GET",
    body = null,
    requiresAuth = false
) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
    };

    if (requiresAuth) {
        const token = localStorage.getItem("jwt_token"); // Token aus dem Storage holen
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        } else {
            // Sollte bei Endpunkten, die Auth erfordern, behandelt werden,
            // normalerweise durch Weiterleitung zum Login
            throw new Error("Authentication required.");
        }
    }

    const options = {
        method,
        headers,
    };

    if (body !== null) {
        // Send body only if provided (allows for requests without body)
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        // Versuche, die Antwort als JSON zu parsen, auch bei Fehlern,
        // da die API eine JSON-Fehlerstruktur zurückgibt.
        let responseData = null;
        try {
            responseData = await response.json();
        } catch (jsonError) {
            // Wenn das Parsen fehlschlägt, aber die Antwort nicht OK ist,
            // behandle es als generischen Fehler.
            if (!response.ok) {
                throw new Error(
                    `API Error: ${response.status} ${response.statusText}`
                );
            }
            // Wenn das Parsen fehlschlägt, die Antwort aber OK ist (z.B. leere 204 Antwort),
            // fahre fort.
        }

        if (!response.ok) {
            // Behandele spezifische API-Fehlerantwortstrukturen
            if (response.status === 422 && responseData?.errors) {
                // Validierungsfehler
                const validationErrors = responseData.errors
                    .map((err) => {
                        // Die API-Dokumentation zeigt { "fieldName": "message" }
                        const field = Object.keys(err)[0];
                        return `${field}: ${err[field]}`;
                    })
                    .join("\n");
                // Wirft einen Fehler mit den Validierungsdetails
                const error = new Error(
                    `Validation Failed:\n${validationErrors}`
                );
                error.status = response.status; // Füge den Status zum Fehlerobjekt hinzu
                error.errors = responseData.errors; // Füge die Fehlerdetails hinzu
                throw error;
            } else {
                // Andere API-Fehler (z.B. 400, 401, 403, 404, 500)
                const error = new Error(
                    responseData?.message ||
                        `API Error: ${response.status} ${response.statusText}`
                );
                error.status = response.status;
                throw error;
            }
        }

        // Bei erfolgreichen Antworten die Daten zurückgeben.
        return responseData;
    } catch (error) {
        console.error("API Call Error:", error);
        // Wirft den Fehler erneut, damit die Komponenten ihn abfangen können
        throw error;
    }
};

// --- Atomare Komponenten (vereinfacht) ---
const Button = ({
    children,
    onClick,
    disabled,
    variant = "primary",
    type = "button",
}) => {
    const baseStyle = `w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`;

    const primaryStyle = `background-color: ${colors.primary}; color: ${colors.background}; hover:opacity-90`;
    const secondaryStyle = `background-color: ${colors.secondary}; color: ${colors.text}; hover:opacity-90 border border-gray-300`; // Rahmen für sekundär hinzugefügt

    const variantStyle = variant === "primary" ? primaryStyle : secondaryStyle;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${
                variant === "primary"
                    ? `bg-[${colors.primary}] text-[${colors.background}]`
                    : `bg-[${colors.secondary}] text-[${colors.text}] border border-gray-300`
            } hover:opacity-90`}
            // Inline-Stil für präzise Farbe, Tailwind-Klassen für andere Stile
            style={
                variant === "primary"
                    ? {
                          backgroundColor: colors.primary,
                          color: colors.background,
                      }
                    : {
                          backgroundColor: colors.secondary,
                          color: colors.text,
                          border: "1px solid #ccc",
                      }
            }
        >
            {children}
        </button>
    );
};

const Input = ({
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    label,
    required = false,
    error,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputBorderColor = error
        ? colors.error
        : isFocused
        ? colors.primary
        : "transparent";

    return (
        <div className="mb-4">
            {label && (
                <label
                    className="block text-sm font-medium mb-2 dark:text-gray-300"
                    style={{ color: colors.text }}
                >
                    {label}{" "}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 outline-none dark:text-white dark:placeholder-gray-400"
                style={{
                    backgroundColor: colors.secondary, // Sekundärfarbe für den Input-Hintergrund
                    border: `2px solid ${inputBorderColor}`,
                    color: colors.text,
                }}
            />
            {error && (
                <p className="mt-1 text-xs" style={{ color: colors.error }}>
                    {error}
                </p>
            )}
        </div>
    );
};

// --- Moleküle (Formen) ---

// RegistrationForm
const RegistrationForm = () => {
    const navigate = useNavigate(); // Verwende useNavigate für die Navigation
    const [formData, setFormData] = useState({
        companyName: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        companyAddress: "",
        companyPhone: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [validationErrors, setValidationErrors] = useState({}); // Zustand für Validierungsfehler

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Lösche den Fehler für dieses Feld bei der Eingabe
        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const newState = { ...prev };
                delete newState[name];
                return newState;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        setValidationErrors({}); // Zurücksetzen bei jedem Absenden

        try {
            const response = await apiClient(
                "/auth/register",
                "POST",
                formData
            );
            setSuccess(response.message);
            // Optional: Nach kurzer Verzögerung zum Login weiterleiten
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            if (err.status === 422 && err.errors) {
                // Spezifische Validierungsfehler von der API
                const apiErrors = {};
                err.errors.forEach((errorDetail) => {
                    const field = Object.keys(errorDetail)[0];
                    apiErrors[field] = errorDetail[field];
                });
                setValidationErrors(apiErrors);
                setError("Please correct the errors below."); // Generische Nachricht für Validierungsfehler
            } else {
                setError(err.message || "Registration failed.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2
                className="text-xl font-semibold text-center dark:text-white"
                style={{ color: colors.text }}
            >
                Register Company & Admin
            </h2>
            <Input
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                required
                error={validationErrors.companyName}
            />
            <Input
                label="First Name (Admin)"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                required
                error={validationErrors.firstName}
            />
            <Input
                label="Last Name (Admin)"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                required
                error={validationErrors.lastName}
            />
            <Input
                label="Email (Admin)"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter admin email"
                required
                error={validationErrors.email}
            />
            <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password (min 8 chars)"
                required
                error={validationErrors.password}
            />
            <Input
                label="Company Address (Optional)"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                placeholder="Enter company address"
                error={validationErrors.companyAddress}
            />
            <Input
                label="Company Phone (Optional)"
                name="companyPhone"
                value={formData.companyPhone}
                onChange={handleChange}
                placeholder="Enter company phone"
                error={validationErrors.companyPhone}
            />

            {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            {success && (
                <div className="text-green-600 text-sm text-center">
                    {success}
                </div>
            )}

            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register"}
            </Button>
            <div className="text-center mt-4">
                <Link
                    to="/login"
                    className="text-sm underline hover:no-underline transition-all duration-200"
                    style={{ color: colors.primary }}
                >
                    Already have an account? Login
                </Link>
            </div>
        </form>
    );
};

// LoginForm
const LoginForm = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const newState = { ...prev };
                delete newState[name];
                return newState;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setValidationErrors({});

        try {
            const response = await apiClient("/auth/login", "POST", formData);
            login(response.token, response.refreshToken);
            navigate("/dashboard"); // Weiterleitung zum Dashboard nach dem Login
        } catch (err) {
            if (err.status === 422 && err.errors) {
                const apiErrors = {};
                err.errors.forEach((errorDetail) => {
                    const field = Object.keys(errorDetail)[0];
                    apiErrors[field] = errorDetail[field];
                });
                setValidationErrors(apiErrors);
                setError("Please correct the errors below.");
            } else {
                setError(err.message || "Login failed.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2
                className="text-xl font-semibold text-center dark:text-white"
                style={{ color: colors.text }}
            >
                Login
            </h2>
            <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                error={validationErrors.email}
            />
            <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                error={validationErrors.password}
            />

            {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Logging In..." : "Login"}
            </Button>
            <div className="text-center mt-4 space-x-4">
                <Link
                    to="/forgot-password"
                    className="text-sm underline hover:no-underline transition-all duration-200"
                    style={{ color: colors.primary }}
                >
                    Forgot Password?
                </Link>
                <Link
                    to="/register"
                    className="text-sm underline hover:no-underline transition-all duration-200"
                    style={{ color: colors.primary }}
                >
                    Register
                </Link>
            </div>
        </form>
    );
};

// ForgotPasswordForm
const ForgotPasswordForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        setValidationErrors({});

        try {
            // API gibt immer 200 OK zurück, um das Offenlegen gültiger E-Mails zu verhindern
            const response = await apiClient("/auth/forgot-password", "POST", {
                email,
            });
            setSuccess(response.message);
            setEmail(""); // E-Mail-Feld leeren
            // Optional: Nach kurzer Verzögerung zum Login weiterleiten
            // setTimeout(() => navigate('/login'), 5000); // Vielleicht nicht, da der Benutzer auf die E-Mail wartet
        } catch (err) {
            if (err.status === 422 && err.errors) {
                const apiErrors = {};
                err.errors.forEach((errorDetail) => {
                    const field = Object.keys(errorDetail)[0];
                    apiErrors[field] = errorDetail[field];
                });
                setValidationErrors(apiErrors);
                setError("Please correct the errors below.");
            } else {
                // Obwohl die API 200 OK zurückgeben soll, fangen wir andere Fehler ab
                setError(err.message || "Request failed.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2
                className="text-xl font-semibold text-center dark:text-white"
                style={{ color: colors.text }}
            >
                Forgot Password
            </h2>
            <Input
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationErrors({});
                }} // Fehler beim Tippen löschen
                placeholder="Enter your email"
                required
                error={validationErrors.email}
            />

            {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            {success && (
                <div className="text-green-600 text-sm text-center">
                    {success}
                </div>
            )}

            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending Request..." : "Send Reset Link"}
            </Button>
            <div className="text-center mt-4">
                <Link
                    to="/login"
                    className="text-sm underline hover:no-underline transition-all duration-200"
                    style={{ color: colors.primary }}
                >
                    Back to Login
                </Link>
            </div>
        </form>
    );
};

// ResetPasswordForm (Token wird aus URL gelesen)
const ResetPasswordForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        token: "", // Das Token, das aus der URL extrahiert wird
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Extrahiere Token beim Komponenten-Mount (z.B. aus window.location.pathname)
    // In einer echten App würdest du URL-Parameter (z.B. useParams aus react-router-dom) verwenden
    React.useEffect(() => {
        // Mock-Extraktion: Angenommen, die URL ist /reset-password/:token
        // In einer echten Anwendung:
        // const { token: urlToken } = useParams();
        // setFormData(prev => ({ ...prev, token: urlToken || '' }));
        // Für dieses Beispiel nehmen wir an, das Token kommt von irgendwoher
        // oder der Benutzer fügt es manuell ein (weniger üblich)
        // Wir lassen das Token-Feld als Eingabe für Testzwecke.
    }, []); // Führe dies nur einmal beim Mounten aus

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const newState = { ...prev };
                delete newState[name];
                return newState;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        setValidationErrors({});

        try {
            const response = await apiClient(
                "/auth/reset-password",
                "POST",
                formData
            );
            setSuccess(response.message);

            // Nach erfolgreichem Zurücksetzen zum Login weiterleiten
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            if (err.status === 422 && err.errors) {
                const apiErrors = {};
                err.errors.forEach((errorDetail) => {
                    const field = Object.keys(errorDetail)[0];
                    apiErrors[field] = errorDetail[field];
                });
                setValidationErrors(apiErrors);
                setError("Please correct the errors below.");
            } else {
                setError(err.message || "Password reset failed.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2
                className="text-xl font-semibold text-center dark:text-white"
                style={{ color: colors.text }}
            >
                Reset Password
            </h2>
            {/* Normalerweise wäre das Token-Feld ausgeblendet und mit dem aus der URL gefüllten Wert */}
            {/* Für Testzwecke lassen wir es sichtbar */}
            <Input
                label="Reset Token"
                name="token"
                value={formData.token}
                onChange={handleChange}
                placeholder="Enter reset token from email link"
                required
                error={validationErrors.token}
            />
            <Input
                label="New Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password (min 8 chars)"
                required
                error={validationErrors.password}
            />

            {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            {success && (
                <div className="text-green-600 text-sm text-center">
                    {success}
                </div>
            )}

            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>
            <div className="text-center mt-4">
                <Link
                    to="/login"
                    className="text-sm underline hover:no-underline transition-all duration-200"
                    style={{ color: colors.primary }}
                >
                    Back to Login
                </Link>
            </div>
        </form>
    );
};

// Email Verification Component (Muss den Token aus der URL lesen)
const VerifyEmail = () => {
    // In einer echten App würdest du den Token aus useParams() holen
    const token = window.location.pathname.split("/verify-email/")[1]; // Dummy-Extraktion
    const navigate = useNavigate();

    const [verificationStatus, setVerificationStatus] =
        useState("Verifying...");
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const verify = async () => {
            if (!token) {
                setError("No verification token found.");
                setVerificationStatus("Verification failed.");
                return;
            }
            try {
                // Die API-Doku zeigt GET /api/auth/verify-email/:token
                // Es gibt keinen Request Body für diesen Endpunkt
                await apiClient(`/auth/verify-email/${token}`, "GET");
                setVerificationStatus("Email verified successfully!");
                // Optional: Nach erfolgreicher Verifizierung zum Login weiterleiten
                setTimeout(() => navigate("/login"), 3000);
            } catch (err) {
                setError(err.message || "Email verification failed.");
                setVerificationStatus("Verification failed.");
            }
        };
        verify();
    }, [token, navigate]); // Abhängigkeiten: token und navigate

    return (
        <div
            className="flex items-center justify-center min-h-screen p-6 dark:bg-gray-900"
            style={{ backgroundColor: colors.background }}
        >
            <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800 text-center">
                <h2
                    className="text-xl font-semibold mb-4 dark:text-white"
                    style={{ color: colors.text }}
                >
                    Email Verification
                </h2>
                <p
                    className="mb-4 dark:text-gray-300"
                    style={{ color: colors.text }}
                >
                    {verificationStatus}
                </p>
                {error && (
                    <div className="text-red-500 text-sm mb-4">{error}</div>
                )}
                {verificationStatus === "Email verified successfully!" ||
                error ? (
                    <Link
                        to="/login"
                        className="text-sm underline hover:no-underline transition-all duration-200"
                        style={{ color: colors.primary }}
                    >
                        Go to Login
                    </Link>
                ) : null}
            </div>
        </div>
    );
};

// Dummy Dashboard Component
const Dashboard = () => {
    const { logout } = useContext(AuthContext);
    const [userDetails, setUserDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                // Requires Authentication = true
                const data = await apiClient("/users/me", "GET", null, true);
                setUserDetails(data.user);
            } catch (err) {
                setError(err.message || "Failed to fetch user details.");
                // Wenn der Fehler 401 ist, könnte der Token abgelaufen sein -> ausloggen
                if (err.status === 401) {
                    logout();
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserDetails();
    }, [logout]); // Abhängigkeit: logout Funktion

    if (isLoading)
        return <div className="text-center p-8">Loading user details...</div>;
    if (error)
        return (
            <div className="text-center p-8 text-red-500">Error: {error}</div>
        );

    return (
        <div
            className="flex items-center justify-center min-h-screen p-6 dark:bg-gray-900"
            style={{ backgroundColor: colors.background }}
        >
            <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800 text-center">
                <h2
                    className="text-2xl font-bold mb-4 dark:text-white"
                    style={{ color: colors.text }}
                >
                    Dashboard
                </h2>
                {userDetails && (
                    <div
                        className="space-y-2 mb-6 text-left dark:text-gray-300"
                        style={{ color: colors.text }}
                    >
                        <p>
                            <strong>Welcome:</strong> {userDetails.first_name}{" "}
                            {userDetails.last_name}
                        </p>
                        <p>
                            <strong>Email:</strong> {userDetails.email}
                        </p>
                        <p>
                            <strong>Company:</strong>{" "}
                            {userDetails.Company?.name}
                        </p>
                        <p>
                            <strong>Role:</strong> {userDetails.Role?.name}
                        </p>
                        {/* Weitere Details anzeigen, falls vorhanden und relevant */}
                    </div>
                )}
                <Button onClick={logout} variant="secondary">
                    Logout
                </Button>
            </div>
        </div>
    );
};

// --- Organismus/Template/Seite ---
const AuthContainer = () => {
    const { isAuthenticated } = useContext(AuthContext);

    // Wrapper, um Formulare in der Layout-Karte zu rendern
    const FormWrapper = ({ children }) => (
        <div
            className="flex items-center justify-center min-h-screen p-6 dark:bg-gray-900"
            style={{ backgroundColor: colors.background }}
        >
            <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800">
                {children}
            </div>
        </div>
    );

    return (
        <Router>
            <Routes>
                {/* Authentifizierte Routen */}
                <Route
                    path="/dashboard"
                    element={
                        isAuthenticated ? (
                            <Dashboard />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                {/* Füge hier weitere authentifizierte Routen hinzu */}

                {/* Nicht-authentifizierte Routen */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <FormWrapper>
                                <LoginForm />
                            </FormWrapper>
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <FormWrapper>
                                <RegistrationForm />
                            </FormWrapper>
                        )
                    }
                />
                <Route
                    path="/forgot-password"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <FormWrapper>
                                <ForgotPasswordForm />
                            </FormWrapper>
                        )
                    }
                />
                {/* Reset Password Route - Token aus URL wird intern gehandhabt, kann aber auch im Formular eingegeben werden */}
                <Route
                    path="/reset-password"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <FormWrapper>
                                <ResetPasswordForm />
                            </FormWrapper>
                        )
                    }
                />
                {/* Email Verification Route - Token aus URL wird intern gehandhabt */}
                <Route
                    path="/verify-email/:token"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <VerifyEmail />
                        )
                    }
                />

                {/* Standard- oder Index-Route */}
                <Route
                    path="/"
                    element={
                        <Navigate
                            to={isAuthenticated ? "/dashboard" : "/login"}
                        />
                    }
                />

                {/* Fallback-Route für nicht gefundene Pfade */}
                <Route
                    path="*"
                    element={
                        <div
                            className="flex items-center justify-center min-h-screen p-6 dark:bg-gray-900"
                            style={{ backgroundColor: colors.background }}
                        >
                            <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800 text-center">
                                <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
                                    404 - Not Found
                                </h2>
                                <p
                                    className="mb-6 dark:text-gray-300"
                                    style={{ color: colors.text }}
                                >
                                    The page you are looking for does not exist.
                                </p>
                                <Link
                                    to={
                                        isAuthenticated
                                            ? "/dashboard"
                                            : "/login"
                                    }
                                    className="text-sm underline hover:no-underline transition-all duration-200"
                                    style={{ color: colors.primary }}
                                >
                                    Go{" "}
                                    {isAuthenticated
                                        ? "to Dashboard"
                                        : "to Login"}
                                </Link>
                            </div>
                        </div>
                    }
                />
            </Routes>
        </Router>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AuthContainer />
        </AuthProvider>
    );
};

// Exportiere Komponenten für die Verwendung mit react-router-dom
// Füge useNavigate hinzu, da es in den Komponenten verwendet wird
import { useNavigate } from "react-router";

export default App;
