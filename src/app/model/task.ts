import { IComment } from './comment';

export interface ITask {
    issueId?: number;
    title: string;
    description: string;
    issueStataus?: string;
    issueCreateDate?: Date;
    issueEndDate?: Date;
    issueSupervisor?: string;
    issuePriority?: string;
    supervisorName?: string; // Nombre completo del supervisor
    idProject?: number; // Proyecto al que pertenece
    idSprint?: number; // Sprint al que pertenece
    comments?: IComment[]; // Comentarios del issue
    typeIssueId?: number; // ID del tipo de issue
    typeIssueDescription?: string; // Descripción del tipo de issue
}