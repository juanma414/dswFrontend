# DswFrontend

Sistema de gestión de tareas (Task Management System) con Angular y Backend NodeJS.

## Requisitos Previos

- Node.js 18 o superior
- pnpm (gestor de paquetes)
- MySQL Server corriendo en localhost:3306
- Base de datos: `app2dolist`

## Configuración del Proyecto

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configuración del Backend

El backend debe estar corriendo en `http://localhost:3000`. 

Para iniciar el backend, ve al directorio `dswBackend` y ejecuta:

```bash
cd ../dswBackend
pnpm install
pnpm run start:dev
```

### 3. Configuración de Environment

El proyecto usa archivos de configuración de environment para gestionar las URLs de la API:

- `src/environments/environment.ts` - Desarrollo
- `src/environments/environment.prod.ts` - Producción

La URL por defecto de la API es: `http://localhost:3000/api`

## Development server

Ejecuta `pnpm start` o `ng serve` para iniciar el servidor de desarrollo. 

Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias algún archivo fuente.

## Estructura del Proyecto

```
src/
├── app/
│   ├── admin/              # Componentes de administración
│   │   └── user-management/  # Gestión de usuarios
│   ├── backlog/            # Vista de backlog
│   ├── dashboard/          # Dashboard de estadísticas
│   ├── guards/             # Guards de autenticación
│   │   ├── admin.guard.ts
│   │   └── auth.guard.ts
│   ├── login/              # Componente de login
│   ├── model/              # Modelos de datos
│   │   ├── comment.ts
│   │   ├── project.ts
│   │   └── task.ts
│   ├── navbar/             # Barra de navegación
│   ├── services/           # Servicios de Angular
│   │   ├── api.service.ts      # Servicio principal de API
│   │   ├── auth.service.ts     # Autenticación
│   │   ├── project-sprint.service.ts
│   │   └── user.service.ts
│   └── todo/               # Vista principal de tareas
├── assets/
└── environments/           # Configuración de environments
```

## Funcionalidades

### Usuarios

- Login de usuarios
- Gestión de usuarios (solo administradores)
- Asignación de issues a usuarios

### Issues (Tareas)

- Crear, editar y eliminar issues
- Drag & Drop para cambiar estado (To Do, In Progress, Done)
- Filtrado por proyecto y sprint
- Prioridades (Baja, Media, Alta)
- Comentarios en issues
- Marcado de issues como completados

### Proyectos y Sprints

- Gestión de proyectos
- Gestión de sprints por proyecto
- Filtrado de issues por proyecto y sprint

### Dashboard (Solo Administradores)

- Estadísticas de issues
- Reportes por usuario
- Filtrado avanzado
- Exportación a CSV

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Tecnologías Utilizadas

- Angular 16
- Angular Material
- RxJS
- TypeScript
- SCSS

## API Endpoints

El frontend se conecta con los siguientes endpoints del backend:

### Users
- `GET /api/user` - Obtener todos los usuarios
- `POST /api/user/login` - Login
- `POST /api/user` - Crear usuario
- `PUT /api/user/:id` - Actualizar usuario
- `DELETE /api/user/:id` - Eliminar usuario

### Issues
- `GET /api/issue` - Obtener todos los issues
- `GET /api/issue/:id` - Obtener un issue
- `POST /api/issue` - Crear issue
- `PUT /api/issue/:id` - Actualizar issue
- `PATCH /api/issue/:id/status` - Actualizar estado
- `DELETE /api/issue/:id` - Eliminar issue (soft delete)

### Projects
- `GET /api/project` - Obtener todos los proyectos
- `GET /api/project/:id` - Obtener un proyecto
- `POST /api/project` - Crear proyecto
- `PUT /api/project/:id` - Actualizar proyecto
- `DELETE /api/project/:id` - Eliminar proyecto

### Sprints
- `GET /api/sprint` - Obtener todos los sprints
- `GET /api/sprint/project/:idProject` - Obtener sprints por proyecto
- `POST /api/sprint` - Crear sprint
- `PUT /api/sprint/:id` - Actualizar sprint
- `DELETE /api/sprint/:id` - Eliminar sprint

### Comments
- `GET /api/comment/issue/:idIssue` - Obtener comentarios de un issue
- `POST /api/comment` - Crear comentario
- `PUT /api/comment/:id` - Actualizar comentario
- `DELETE /api/comment/:id` - Eliminar comentario

## Notas Importantes

1. Asegúrate de que el backend esté corriendo antes de iniciar el frontend
2. La base de datos MySQL debe estar corriendo en `localhost:3306`
3. El usuario por defecto de la base de datos es `root` con contraseña `root`
4. Los administradores tienen permisos adicionales para gestionar usuarios y eliminar issues

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
