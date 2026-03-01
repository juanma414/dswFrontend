export interface IComment {
    idComment?: number;
    description: string;
    createDate?: Date;
    userName?: string; // Para mostrar en la UI
    idUser?: number; // ID del usuario que comenta (opcional para mostrar)
    idIssue?: number; // ID del issue (opcional para mostrar)
    issue?: any; // Relación con issue (para enviar al backend)
    user?: any; // Relación con user (para enviar al backend o datos completos cuando viene del backend)
}
