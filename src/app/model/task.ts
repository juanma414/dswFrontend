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
}