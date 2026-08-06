# 🧙‍♂️ ChatBattle: Typemancer PvP

Un juego PvP 1v1 en tiempo real donde dos magos se enfrentan mediante tipeo de hechizos, precisión y modificadores de capitalización.

Repository: [https://github.com/pablixs/WizardChatBattle.git](https://github.com/pablixs/WizardChatBattle.git)

---

## ⚡ Mecánicas de Tipeo

| Estilo al Tipear | Ejemplo | Efecto | Regla de Balance |
| :--- | :--- | :--- | :--- |
| **MAYÚSCULA** | `FIREBALL` | **Super Hechizo (+50% Daño)** | Consumes 1 Carga de Mayúscula (Máx 3) |
| **minúscula** | `fireball` | **Lanzamiento Ligero (85% daño)** | -20% Tiempo de Recarga / Cooldown |
| **aLtErNaDo** | `fIrEbAlL` | **Caos Total** | 50% Crítico x2 / 50% Recular (Daño propio) |
| **Abreviado** | `frbl` | **Tiro Desesperado** | 80% Probabilidad de Fallo (Fizzle) / 20% Impacto directo |

---

## 🛠️ Desarrollo Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Partida Local 1v1**:
   - Abre dos pestañas en tu navegador en `http://localhost:5173`.
   - Únete a la misma sala (ej: `AB12`) en ambas pestañas usando **Modo Local**.

---

## 🚀 Despliegue en Vercel (Frontend Web)

1. Conecta el repositorio de GitHub [`pablixs/WizardChatBattle`](https://github.com/pablixs/WizardChatBattle) a tu cuenta de Vercel.
2. La configuración incluida en `vercel.json` autodetectará:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Haz clic en **Deploy**.

---

## 🌐 Despliegue en Cloudflare Workers / PartyKit (Backend de Salas)

Para publicar el Durable Object `GolfRoom` (`party/golf-room.js`) en tu cuenta de Cloudflare:

1. Ejecuta el comando de despliegue de PartyKit:
   ```bash
   npx partykit deploy
   ```
2. Una vez desplegado, obtendrás tu URL de Cloudflare (ejemplo: `mi-chatbattle.username.partykit.dev`).
3. Introduce esa URL en el campo **Host Servidor Cloudflare** al unirte a la sala en el frontend.
