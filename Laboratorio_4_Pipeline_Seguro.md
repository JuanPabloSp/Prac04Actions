# Laboratorio 4 — Pipeline seguro con permissions y environments

## Mis Objetivos
En este laboratorio he practicado e implementado los pilares fundamentales de la seguridad en sistemas de CI/CD utilizando GitHub Actions:
- **permissions** (Principio de privilegios mínimos a nivel global y de job).
- **secrets & vars** (Gestión segura de credenciales sensibles y variables no sensibles).
- **environments** (Aislamiento de etapas de ciclo de vida del software: staging y production).
- **approvals** (Políticas de aprobación manual de cambios por revisores designados).
- **mínimos privilegios** (Restricción exhaustiva del GITHUB_TOKEN).
- **seguridad de workflows** (Evitar inyecciones, fugas y ataques de cadena de suministro).

---

## Escenario del Laboratorio
El objetivo planteado para este pipeline de despliegue seguro fue:
1. Construir la aplicación (build).
2. Validar mediante tests (test).
3. Requerir aprobación para producción (deploy-production).
4. Usar permisos mínimos (contents: read).
5. Evitar la exposición de secretos en los logs de ejecución.

---

## Mi Solución y Requisitos Implementados

### Parte 1 — Secrets
He estructurado la gestión de datos de configuración dividiendo rigurosamente la información sensible de la no sensible, haciendo un uso seguro del contexto de entornos en GitHub.

#### 1. Definición de Variables y Secretos Creados:
- **Secret de Despliegue (`DEPLOY_TOKEN`)**: Token de autenticación altamente sensible para conectarme a la infraestructura de despliegue de forma segura.
- **Secret de API (`API_KEY`)**: Credencial para autenticar las solicitudes de mi backend contra servicios externos de datos.
- **Variable no Sensible (`API_URL`)**: Dirección endpoint de la API pública de desarrollo o producción (por ejemplo, `https://api.staging.example.com` y `https://api.production.example.com`).

A continuación muestro mi proceso de creación de un secreto de entorno (`DEPLOY_TOKEN` con valor de prueba `token_secreto_staging_123`) dentro del scope de `staging`:

![Creando DEPLOY_TOKEN en Staging](./img/Captura%20de%20pantalla%202026-05-21%20111017.png)

Una vez que he creado los secretos, procedí a declarar las variables no sensibles en el mismo apartado:

![Secretos creados y botón de Variables en Staging](./img/Captura%20de%20pantalla%202026-05-21%20111058.png)

Del mismo modo, para el entorno de **`production`**, configuré sus respectivos secretos y definí la variable no sensible `API_URL` con el endpoint de producción para demostrar el aislamiento de scopes y valores específicos por entorno:

![Secretos creados en el entorno de Production](./img/Captura%20de%20pantalla%202026-05-21%20111247.png)

![Creando la variable API_URL en el entorno de Production](./img/Captura%20de%20pantalla%202026-05-21%20111309.png)

#### 2. Diferencias entre `vars` y `secrets` (Lo que he aprendido)

| Característica | Variables (`vars`) | Secretos (`secrets`) |
| :--- | :--- | :--- |
| **Encriptación** | Almacenadas en texto plano. No encriptadas. | Encriptadas fuertemente en reposo mediante llaves asimétricas (libsodium). |
| **Visibilidad en Logs** | Visibles en texto plano en la consola de GitHub Actions si las imprimo. | Enmascaradas automáticamente por GitHub. Se muestran como `***` si intento imprimirlas en consola. |
| **Caso de Uso** | URLs de APIs, nombres de entornos, puertos, banderas de feature-toggles. | Contraseñas, claves SSH, API keys, tokens de base de datos, credenciales cloud. |
| **Visualización** | Modificables directamente en la interfaz gráfica de forma visible. | Solo pueden ser creadas o sobrescritas; nunca las puedo volver a visualizar en texto plano una vez guardadas. |

#### 3. El Concepto de Scope (Repository vs Environment)
- **Repository Scope**: Las variables y secretos creados a nivel de repositorio están disponibles para cualquier job en cualquier rama. Esto representa un riesgo para mis secretos de producción, ya que código no auditado de una rama de pruebas (`feature`) podría leerlos y exponerlos.
- **Environment Scope**: Al vincular mis secretos a un entorno específico (como `staging` o `production`), GitHub solo permite al runner acceder a ellos si el job declara explícitamente `environment: staging` o `environment: production`. Esto me permite **reutilizar los mismos nombres** (`API_KEY`, `DEPLOY_TOKEN`) con valores diferentes y aislados para cada fase del ciclo de vida.

---

### Parte 2 — Permissions
De forma predeterminada, los tokens automáticos de GitHub (`GITHUB_TOKEN`) pueden heredar permisos de escritura amplios, lo que vulnera el principio de privilegios mínimos. Por ello, he decidido reducirlos estrictamente.

#### 1. Reducción a Nivel de Workflow (Global)
He configurado permisos globales ultra-restrictivos al inicio de mi archivo `.yml`. Por defecto, el token de GitHub solo puede leer mi código:
```yaml
permissions:
  contents: read
```
Esto revoca inmediatamente los permisos de escritura en paquetes, despliegues, incidencias, pull requests y en mi propio árbol de código git.

#### 2. Reducción a Nivel de Job (Granularidad)
Cada Job individual de mi workflow reafirma o especifica su set de permisos mínimos para garantizar que ningún job comprometido pueda abusar del token:
```yaml
jobs:
  build:
    permissions:
      contents: read # Solo necesito leer el repositorio para verificar y compilar sintaxis
  test:
    permissions:
      contents: read # Solo necesito leer el repositorio para ejecutar los tests unitarios de Python
  deploy-staging:
    permissions:
      contents: read
  deploy-production:
    permissions:
      contents: read
```

#### 3. Validación: ¿Qué ocurre si me faltan permisos?
Si un atacante modifica mi pipeline o si intento ejecutar una acción de escritura (como crear un release de git o subir una imagen de docker a GitHub Packages) sin tener configurados los permisos adecuados, GitHub Actions detendrá inmediatamente el paso con fallos de autorización:
- **Error típico en consola**: `HttpError: Resource not accessible by integration` o `Status Code: 403 (Forbidden)`.
- **Fallo en Checkout**: Si intento hacer un `git push` de vuelta al repositorio desde un runner que solo cuenta con `contents: read`, la consola me mostrará:
  ```bash
  fatal: unable to access 'https://github.com/JuanPabloSp/Prac04Actions/': 
  The requested URL returned error: 403
  ```
Esto previene que código de prueba o dependencias maliciosas introduzcan cambios no autorizados en mi rama principal.

---

### Parte 3 — Environments
He configurado entornos de desarrollo para aislar los recursos de infraestructura y permitirme definir reglas obligatorias antes de interactuar con mis sistemas de producción.

#### 1. Creación de mis Entornos `staging` y `production`
He creado de manera correcta ambos entornos en la sección de configuración de mi repositorio, permitiendo aislar sus configuraciones y reglas de despliegue:

![Entornos creados en GitHub Settings](./img/Captura%20de%20pantalla%202026-05-21%20110913.png)

#### 2. Configuración de Reglas de Protección Manual y Revisores para `production`
Para asegurar la gobernanza de mi despliegue en producción, he activado la opción **Required reviewers** y he designado a mi usuario de GitHub (`JuanPabloSp`) como revisor obligatorio:

![Configuración de revisores requeridos para Production](./img/Captura%20de%20pantalla%202026-05-21%20111735.png)

Esto me garantiza que ningún despliegue a Producción se realice de forma accidental o sin mi consentimiento explícito en la UI.

---

### Parte 4 — Conditions
He rediseñado el pipeline para que actúe de manera estrictamente **secuencial** y segura. En lugar de desplegar a Staging y Producción de forma simultánea, mi flujo se ejecuta como una serie de puertas de seguridad:

1. **Solo si mis tests son correctos**: Lo he implementado mediante dependencias de jobs (`needs`):
   ```yaml
   deploy-staging:
     needs: [build, test]
   ```
   Si el paso de mis pruebas automatizadas en Python (`python -m unittest test_app.py`) falla, el despliegue a Staging se aborta de inmediato.

2. **Despliegue Secuencial (Staging antes de Producción)**: Para asegurarme de que el código haya sido verificado primero en mi entorno de pre-producción, el job de producción depende directamente del éxito de staging:
   ```yaml
   deploy-production:
     needs: [deploy-staging]
   ```

3. **Solo desde la rama `main` y tras aprobación manual**: El job de producción cuenta con una regla condicional explícita para evitar que ramas de pruebas accedan a producción, y está vinculado a mi entorno protegido:
   ```yaml
   deploy-production:
     needs: [deploy-staging]
     if: github.ref == 'refs/heads/main'
     environment:
       name: production
   ```

Al dispararse mi pipeline en `main`, el job de Producción queda en pausa, mostrándome una alerta visual y bloqueando la infraestructura hasta recibir mi aprobación:

![Pipeline secuencial en pausa esperando mi aprobación manual](./img/Captura%20de%20pantalla%202026-05-21%20112107.png)

---

### Parte 5 — Seguridad (Mi Análisis de Riesgos)

#### 1. Riesgos de Exponer Secretos en Logs
- **El Riesgo**: Imprimir secretos en los logs (`echo $DEPLOY_TOKEN`) expone de forma directa mis credenciales a cualquier persona con acceso de lectura en el repositorio.
- **Mitigación**: GitHub enmascara los secretos detectados con `***`. Sin embargo, he aprendido que esto es evitable mediante codificaciones base64 o fragmentación.
- **Mejor Práctica Aplicada**: Nunca uso comandos `echo` directos con secretos en los scripts de ejecución. Los mapeo como variables de entorno (`env`) y los utilizo de forma nativa e interna en mis comandos o scripts de despliegue.

#### 2. Riesgos de Actions Externas sin Pinning
- **El Riesgo**: Referenciar acciones con tags mutables (ej. `uses: actions/setup-python@main` o `uses: actions/setup-python@v5`) me expone a un ataque de **Supply Chain** si la cuenta del creador de la acción es comprometida o si se sube código malicioso a la versión taggeada.
- **Mitigación en este Laboratorio**: Durante la práctica, mi pipeline inicialmente falló debido a un commit hash corrupto o inexistente (`db121b9a1755a0651c224401a4571bdf255c5a0a`). Busqué el hash de commit criptográficamente seguro y oficial del release **v5.1.0** de `actions/setup-python` en GitHub, el cual es **`82c7e631bb3cdc910f68e0081d67478d79c6982d`**, y lo apliqué en mi archivo `.yml`.
- **Mejor Práctica Aplicada**: Utilizar siempre hashes SHA inmutables de 40 caracteres hexadecimales para todas las acciones externas de terceros.

#### 3. Riesgos de Permisos Excesivos
- **El Riesgo**: Un pipeline con permisos por defecto de escritura (`write`) amplios a nivel global de `GITHUB_TOKEN` puede ser explotado si se descarga una dependencia de desarrollo comprometida en la fase de test, permitiéndole inyectar commits directamente o extraer secretos.
- **Mejor Práctica Aplicada**: Mantengo la directiva `permissions: contents: read` global y activo de forma granular solo lo que necesite cada paso.

---

## Restricciones Aplicadas en mi Entorno
- **Cero permisos `write` innecesarios**: Bloqueados en mi archivo `.yml` a `contents: read`.
- **Sin impresión de secretos**: Inyecto mis secretos como variables de entorno de contenedor locales (`DEPLOY_TOKEN` y `API_KEY`).
- **Sin tags mutables**: Todas las acciones de mi pipeline de GitHub Actions están fijadas a su hash de commit SHA estable e inmutable.

---

## Entregables de mi Proyecto

1. **Workflow Seguro (`.yml`)**: Lo he configurado de forma completamente funcional y segura en [.github/workflows/secure-pipeline.yml](file:///c:/Users/servin.T38/Downloads/LAB04/.github/workflows/secure-pipeline.yml).
2. **Mi Explicación de Permissions**: Desarrollada detalladamente en la *Parte 2*.
3. **Mi Explicación de Protections**: Desarrollada en la *Parte 3*.
4. **Mi Evidencia de Aprobación Manual**:
   Una vez que aprobé el despliegue a producción en la UI, mi pipeline se ejecutó secuencialmente y finalizó en estado **Success** (verde completo):

![Pipeline secuencial completado con éxito tras mi aprobación](./img/Captura%20de%20pantalla%202026-05-21%20112136.png)

---

## Dificultades superadas y lecciones aprendidas
- **Resolución de Dependencias Corruptas**: Aprendí la importancia de validar los hashes SHA oficiales de los releases de acciones de terceros de GitHub para evitar fallos de resolución de entorno.
- **Control de Puertas de Enlace**: Configurar un flujo estrictamente secuencial (`build/test` ➡️ `staging` ➡️ `production`) me asegura que la infraestructura crítica nunca sea afectada por código inestable que no haya superado las etapas previas de prueba.
