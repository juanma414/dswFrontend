// ============ Respuestas genéricas de API ============
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  status?: number;
}

export interface ApiListResponse<T> {
  data?: T[];
  projectsClasses?: T[];
  sprintsClasses?: T[];
  message?: string;
  success?: boolean;
  status?: number;
}

// ============ Usuario ============
export interface IUser {
  userId: number;
  userEmail: string;
  userPassword?: string; // Solo en request
  userName: string;
  userLastName?: string;
  userRol: 'administrator' | 'supervisor' | 'developer';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  userEmail: string;
  userPassword: string;
}

export interface LoginResponse {
  userId?: number;
  userEmail?: string;
  userName?: string;
  userRol?: string;
  token?: string;
  message?: string;
}

export interface RegisterRequest {
  userEmail: string;
  userPassword: string;
  userName: string;
  userRol?: string;
}

export interface RegisterResponse {
  userId?: number;
  userEmail?: string;
  userName?: string;
  userRol?: string;
  token?: string;
  message?: string;
}

// ============ Tipo de Issue ============
export interface ITypeIssue {
  typeIssueId: number;
  typeIssueDescription: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============ Respuestas específicas ============
export interface ProjectsResponse {
  projectsClasses: Array<{
    idProject: number;
    description: string;
  }>;
}

export interface SprintsResponse {
  sprintsClasses: Array<{
    idSprint: number;
    nroSprint: number;
    startDate: Date;
    endDate: Date;
    description: string;
    idProject?: number;
  }>;
}
