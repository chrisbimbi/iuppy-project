export class SubmitQuizDto {
    questionId: string;
    selectedOptions: string[]; // Array of option IDs
}

export class CompleteQuizStepDto {
    answers: SubmitQuizDto[];
}
