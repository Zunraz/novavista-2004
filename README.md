# NovaVista 2004 — Sistema Operativo Incremental Roguelite

Un **sistema operativo completo de los años 2000** totalmente funcional que esconde una aventura incremental de **contratos CTF**. Ventanas arrastrables, barra de tareas, navegador, banco, red social, correo, antivirus, terminal… y una campaña de hacking ficticio que atraviesa cuatro épocas, con encargos secundarios, herramientas mejorables, una Red táctica roguelite opcional y endgame ampliable.

100 % **autocontenido**: sin servidores, sin CDN, sin dependencias externas. Funciona abriendo `index.html` (o `dist/index.html`, la versión de producción) en cualquier navegador moderno, incluso sin conexión.

---

## ▶ Cómo jugar

1. Abre **`index.html`** (desarrollo) o **`dist/index.html`** (producción, un solo archivo).
2. Espera el arranque estilo BIOS, ponle nombre a tu hacker y ¡a construir tu imperio digital!

El idioma puede cambiarse en cualquier momento con el botón **ES/EN de la bandeja**, a la derecha de la barra de tareas, o desde **Panel de control → Sonido → Idioma**. Español e inglés se aplican al instante y la preferencia queda guardada en la cuenta.

### Flujo recomendado
- **Sigue la campaña CTF**: abre **NovaOps**, acepta el siguiente caso y resuelve pruebas de inspección HTML, FTP, cifrado, hashes, capas y paquetes. El widget del escritorio siempre señala el objetivo concreto.
- **Elige tus encargos**: los siete contratos principales conectan Classic, Aero, Metro y Nova; los secundarios tienen lore propio y pagan dinero, XP, fama y reputación sin bloquear la historia.
- **Mejora tu equipo**: el Laboratorio acelera fuentes, wordlists, decodificación y hashes; las herramientas consumibles ayudan con tareas concretas sin sustituir el razonamiento.
- **Alterna actividades**: publica en **MyNova**, usa el banco, vende datos, juega a NovaClick o entra en la **Red táctica**, un roguelite breve de pocos nodos que ya no condiciona la campaña.
- **Progresión meta**: las **NovaCoins** se gastan en implantes permanentes y permiten acumular legado entre formateos.
- **Prestige**: en *Panel de control → Sistema* puedes **Formatear C:** para convertir tus NovaCoins históricas en **puntos de legado** (+3 % de ingresos permanentes cada uno). La curva es de largo plazo: 1 punto a 20 NC, 2 a 80 y 5 a 500.
- **Misiones**: revisa **NovaMail** para reclamar recompensas.
- **Historia, épocas y final**: cada CTF principal añade evidencia al expediente y nuevos mensajes en **NovaMessenger**. Classic, Aero, Metro y Nova cambian la identidad visual y las aplicaciones. Tras la decisión final se abre el **Archivo ∞**, preparado para contratos diarios y futuros CTF.

### Apps del sistema
| App | Función |
|---|---|
| NovaNet Explorer | Buscador, noticias, foros, descargas de herramientas y el minijuego NovaClick |
| Primer Banco Nova | Intereses, mercado de NovaCoins (compra/venta con precio fluctuante) y préstamos |
| MyNova | Red social: publicaciones, seguidores e ingresos publicitarios |
| Mis Archivos | Almacén de datos (con límite de disco), venta de datos e inventario de herramientas |
| NovaOps | **Núcleo del juego**: campaña y contratos CTF secundarios, expediente RED-NOVA, herramientas, reputación y endgame |
| Red táctica | Roguelite secundario de pocos nodos: ICE con intenciones anunciadas, protocolos, botín e implantes |
| NovaShield | Antivirus/cortafuegos: bloquea amenazas y gestiona la cuarentena |
| NovaMail | Misiones (con badge de reclamables en el escritorio) y notificaciones |
| Símbolo del sistema | Consola con comandos de época (prueba `explorer`, `manual`, `hack`, `gato`…) |
| Manual de NovaVista | **Tutorial guiado**: primer CTF, herramientas, economía, épocas, historia, misiones y actividades opcionales |
| NovaMessenger | Mensajero estilo MSN y archivo narrativo: contactos, conversaciones y capítulos ligados a evidencias CTF |
| NovaPinball | Pinball 2D con física real: 50 puntos = 1 $ canjeable al acabar la partida |
| NovaPool 8-Ball | Billar contra la CPU: gana 25 $ por partida |
| Sala de Trofeos | 10 logros permanentes con insignias, rarezas, progreso y recompensas reclamables |
| Administrador de tareas | Abre con Ctrl+Mayús+Esc: cierra ventanas colgadas y muestra CPU/RAM simuladas |
| Panel de control | Temas, 6 fondos, 16 avatares, sonido, notificaciones, cuenta y gestión del guardado |

---

## 🛡️ Seguridad (lo que hace el juego para evitar trampas)

Este es un juego de navegador: el código se ejecuta en tu máquina, por lo que **ningún juego 100 % cliente-side puede ser inexpugnable**. Dicho esto, NovaVista aplica varias capas de defensa:

1. **Guardado firmado**: cada partida se serializa y se firma con un hash de dos pasadas + una **sal aleatoria de instalación** persistente. Editar `localStorage` o importar un guardado modificado rompe la firma y el juego lo rechaza.
2. **Copia de seguridad firmada**: ante un guardado corrupto o manipulado, se intenta restaurar automáticamente la última copia válida.
3. **Cuarentena**: si se detecta manipulación (guardado alterado, valores corruptos, saltos de reloj, `Math.random` parcheado, contaminación de prototipos o edición en memoria del estado), el sistema entra en **cuarentena**: deja de guardar progreso y muestra una alerta en NovaShield. Solo se sale restaurando una copia válida o formateando.
4. **Estado en closure**: las monedas y el progreso viven en un cierre inaccesible; la UI solo recibe copias. Toda mutación pasa por funciones validadas (números finitos, no negativos, límites).
5. **Verificador en memoria**: un chequeo periódico valida invariantes del estado (dinero no negativo, energía ≤ máximo, disco ≤ máximo, niveles enteros…) y un **ledger anti-crecimiento** detecta aumentos de dinero absurdos entre comprobaciones (p. ej. `addCash(1e9)` por consola). Cualquier valor inválido → cuarentena. La API del estado está sellada (no se pueden reemplazar sus funciones).
6. **Tiempo acotado**: los deltas entre ticks están limitados y el cálculo offline (50 % de eficiencia) tiene un tope de 8 horas, para que adelantar el reloj no sirva de mucho.
7. **Entrada saneada**: la consola y los campos de texto se renderizan con `textContent` (sin inyección HTML); el navegador simulado solo muestra páginas internas y escapa cualquier entrada del usuario.

> Nota honesta: un usuario con conocimientos avanzados puede parchear funciones o leer el código fuente. La cuarentena y las firmas están pensadas para disuadir el *cheating* casual (editar el guardado, inyectar dinero por consola) y como parte del tema del juego (¡el propio antivirus te atrapa!). Si modificas el juego, el sistema te lo hará saber de la forma más auténtica posible.

---

## 🧪 Tests

```bash
node test/core.test.js       # lógica pura (economía, catálogo CTF, estado, física e integridad)
node test/dom.test.js        # integración con jsdom, incluido el primer CTF y la Red táctica
TARGET="$(pwd)/dist/index.html" node test/dom.test.js   # mismos tests contra el build
node test/layout.test.js     # auditoría visual con Chromium (idiomas, ventanas, CTF y Red táctica)
node test/layout.test.js dist# idem contra dist/index.html (capturas en test/shots/)
```

## 🏗️ Build de producción

```bash
node build/build.js   # genera dist/index.html (CSS+JS inline, comentarios fuera)
```

## 📁 Estructura

```
index.html            # shell del SO + sprite SVG de iconos
css/main.css          # chrome del sistema (tema Luna/XP, ventanas, barra de tareas)
css/apps.css          # estilos de las aplicaciones
js/core/              # utils, seguridad, guardado, catálogo, estado, ventanas, eventos
js/apps/              # boot, diálogos, escritorio, barra, panel, archivos, terminal,
                      # correo, banco, social, navegador, antivirus, CTF y Red táctica
js/main.js            # arranque y bucle del juego
build/build.js        # generador de dist/
test/                 # suites de tests
```

## ©

NovaVista 2004 es una obra de ficción. Cualquier parecido con sistemas operativos reales es puramente nostálgico. No se realiza ninguna conexión de red real: todo el «internet» del juego es simulado dentro de tu navegador.
