# NovaVista 2004 — Sistema Operativo Incremental Roguelite

Un **sistema operativo completo de los años 2000** totalmente funcional que esconde un **juego incremental con rasgos roguelite**. Ventanas arrastrables, barra de tareas, menú inicio, arranque estilo BIOS, navegador, banco, red social, correo, antivirus, terminal… y una red subterránea de **asaltos procedurales** donde robas datos, esquivas el rastreo y acumulas **NovaCoins** para comprar implantes permanentes.

100 % **autocontenido**: sin servidores, sin CDN, sin dependencias externas. Funciona abriendo `index.html` (o `dist/index.html`, la versión de producción) en cualquier navegador moderno, incluso sin conexión.

---

## ▶ Cómo jugar

1. Abre **`index.html`** (desarrollo) o **`dist/index.html`** (producción, un solo archivo).
2. Espera el arranque estilo BIOS, ponle nombre a tu hacker y ¡a construir tu imperio digital!

### Flujo recomendado
- **Gana dinero**: publica en **MyNova** (seguidores → publicidad), deja saldo en el **Primer Banco Nova** (intereses), vende datos en **Mis Archivos** y haz clic en **NovaClick**.
- **Avanza el roguelite**: abre el **Mapa de Red**, conéctate, escanea nodos, rompe firewalls y drena datos. Cuidado con el **rastro**: si llega a 100 te localizan y pierdes el botín.
- **Progresión meta**: las **NovaCoins** (minadas con bots, robadas en nodos profundos o ganadas en el MasterServer) se gastan en **implantes** que persisten entre asaltos.
- **Prestige**: en *Panel de control → Sistema* puedes **Formatear C:** para convertir tus NovaCoins acumuladas en **puntos de legado** (+3 % de ingresos permanentes cada uno).
- **Misiones**: revisa **NovaMail** para reclamar recompensas.

### Apps del sistema
| App | Función |
|---|---|
| NovaNet Explorer | Buscador, noticias, foros, descargas de herramientas y el minijuego NovaClick |
| Primer Banco Nova | Intereses, mercado de NovaCoins (compra/venta con precio fluctuante) y préstamos |
| MyNova | Red social: publicaciones, seguidores e ingresos publicitarios |
| Mis Archivos | Almacén de datos (con límite de disco), venta de datos e inventario de herramientas |
| Mapa de Red | **Núcleo roguelite**: asaltos procedurales, implantes, legado y registro |
| NovaShield | Antivirus/cortafuegos: bloquea amenazas y gestiona la cuarentena |
| NovaMail | Misiones (con badge de reclamables en el escritorio) y notificaciones |
| Símbolo del sistema | Consola con comandos de época (prueba `explorer`, `manual`, `hack`, `gato`…) |
| Manual de NovaVista | **Tutorial del juego en el escritorio**: cómo ganar dinero, asaltos, implantes y legado |
| NovaMessenger | Mensajero instantáneo estilo MSN: contactos con estado, "escribiendo..." y regalos ocasionales |
| NovaPinball | Pinball 2D con física real: 50 puntos = 1 $ canjeable al acabar la partida |
| NovaPool 8-Ball | Billar contra la CPU: gana 25 $ por partida |
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
node test/core.test.js       # 100 tests de lógica pura (economía, banco, física, integridad, asaltos)
node test/dom.test.js        # 51 tests de integración con jsdom (arranca el juego real)
TARGET="$(pwd)/dist/index.html" node test/dom.test.js   # mismos tests contra el build
node test/layout.test.js     # 16 tests de maquetación con Chromium headless (desbordes, texto, consola, canvas)
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
                      # correo, banco, social, navegador, antivirus, mapa de red
js/main.js            # arranque y bucle del juego
build/build.js        # generador de dist/
test/                 # suites de tests
```

## ©

NovaVista 2004 es una obra de ficción. Cualquier parecido con sistemas operativos reales es puramente nostálgico. No se realiza ninguna conexión de red real: todo el «internet» del juego es simulado dentro de tu navegador.
