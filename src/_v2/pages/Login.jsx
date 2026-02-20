// ===== IMPORTS =====
// 1. React core
import { useState, useEffect, useCallback } from "react";

// 2. React Router
import { useNavigate } from "react-router-dom";

// 3. Radix UI
import {
  Box,
  Card,
  Container,
  Flex,
  Text,
  TextField,
  Button,
  Callout,
  Separator
} from "@radix-ui/themes";

// 4. Custom Components
import ServerStatus from "@/components/ServerStatus";
import BrandLogo from "@/components/common/BrandLogo";

// 5. Custom Hooks
import { useAuth } from "@/auth/AuthContext";

// ===== MAIN COMPONENT =====
/**
 * Page de connexion avec gestion d'authentification et redirection.
 * 
 * Fonctionnalités :
 * - Authentification utilisateur (email + mot de passe)
 * - Redirection post-login vers destination prévue ou /interventions
 * - Monitoring statut serveur (offline mode)
 * - Gestion erreurs réseau et authentification
 * - Stockage redirection en localStorage
 * 
 * @component
 * @returns {JSX.Element} Page login avec formulaire et logo
 * 
 * @example
 * // Route publique dans App.jsx
 * <Route path="/login" element={<Login />} />
 */
export default function Login() {
  // ----- State -----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ----- Router & Hooks -----
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // ===== HELPERS =====
  /**
   * Redirige après authentification réussie vers destination prévue ou défaut
   * @private
   */
  const handleRedirectAfterLogin = useCallback(() => {
    const redirectUrl = localStorage.getItem("redirect_after_login");
    if (redirectUrl) {
      localStorage.removeItem("redirect_after_login");
      navigate(decodeURIComponent(redirectUrl), { replace: true });
    } else {
      navigate("/technician", { replace: true });
    }
  }, [navigate]);

  // ----- Effects -----
  useEffect(() => {
    // Rediriger utilisateurs déjà authentifiés vers destination prévue
    if (isAuthenticated) {
      handleRedirectAfterLogin();
    }
  }, [handleRedirectAfterLogin, isAuthenticated, navigate]);

  // ===== HANDLERS =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      handleRedirectAfterLogin(); // Réutilise la même logique
    } catch (err) {
      console.error("Erreur de connexion:", err);
      
      if (err.code === 'ERR_NETWORK') {
        setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
      } else if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else {
        setError("Une erreur est survenue lors de la connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER =====
  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--gray-2)",
        padding: "1rem"
      }}
    >
      <Container size="1" style={{ maxWidth: "420px" }}>
          <Card size="4">
            <Flex direction="column" gap="4">
              {/* Logo */}
              <Flex direction="column" align="center" gap="2" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <BrandLogo size="desktop" showTitle={true} logoSizeOverride="400" showSubtitle={true}/>
              </Flex>
              <Separator size="4" />

              {/* Server Status */}
              <ServerStatus showDetails={false} />

              {/* Error Message */}
              {error && (
                <Callout.Root color="red" size="1" id="form-error" role="alert" aria-live="polite">
                  <Callout.Icon>⚠️</Callout.Icon>
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} role="form" aria-label="Formulaire de connexion">
                <Flex direction="column" gap="3">
                  <Box>
                    <Text size="2" weight="medium" as="label" htmlFor="email" style={{ display: "block", marginBottom: "0.5rem" }}>
                      Email
                    </Text>
                    <TextField.Root
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre@email.com"
                      autoComplete="email"
                      disabled={loading}
                      size="3"
                      aria-describedby={error ? "form-error" : undefined}
                    />
                  </Box>

                  <Box>
                    <Text size="2" weight="medium" as="label" htmlFor="password" style={{ display: "block", marginBottom: "0.5rem" }}>
                      Mot de passe
                    </Text>
                    <TextField.Root
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={loading}
                      size="3"
                      aria-describedby={error ? "form-error" : undefined}
                    />
                  </Box>

                  <Button
                    type="submit"
                    size="3"
                    disabled={loading}
                    style={{ width: "100%", marginTop: "0.5rem" }}
                  >
                    {loading ? (
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid currentColor",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite"
                          }} />
                        Connexion...
                      </Flex>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </Flex>
              </form>

              <Separator size="4" />

              {/* Info Box */}
              <Callout.Root color="blue" size="1">
                <Callout.Icon>ℹ️</Callout.Icon>
                <Callout.Text>
                  <Text size="1" weight="bold" style={{ display: "block", marginBottom: "2px" }}>
                    Mode hors ligne disponible
                  </Text>
                  <Text size="1" color="gray">
                    Les données en cache restent accessibles sans connexion
                  </Text>
                </Callout.Text>
              </Callout.Root>
            </Flex>
          </Card>
        </Container>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}

// ===== PROP TYPES =====
Login.propTypes = {
  // Login page a aucune props (route publique)
};
