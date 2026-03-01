export interface Project {
  idProject: number;
  description: string;
}

export interface Sprint {
  idSprint: number;
  nroSprint: number;
  startDate: Date;
  endDate: Date;
  description: string;
  idProject?: number; // Relación con el proyecto
}
